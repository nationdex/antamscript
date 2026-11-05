import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { BaseCommand, type IBaseCommand } from "../structure/base/BaseCommand";
import { FileReader } from "../core/FileReader";
import type { AntamClient } from "../core/AntamClient";
import readdir from "../utils/readdir";
import { Transpiler } from "../core/Transpiler";
import { Code } from "../structure";

const require = createRequire(import.meta.url);

export interface ICommandManagerEvents {
  update: [];
}

export abstract class BaseCommandManager<
  T extends string,
> extends EventEmitter {
  private readonly commands = new Map<T, BaseCommand<T>[]>();
  private readonly paths = new Set<string>();

  public abstract readonly handlerName: string;

  protected constructor(private readonly client: AntamClient) {
    super();
  }

  public async refresh(): Promise<void> {
    for (const [type, commands] of this.commands) {
      const retained = commands.filter((command) => !command.data.unloadable);
      if (retained.length) this.commands.set(type, retained);
      else this.commands.delete(type);
    }

    for (const directory of this.paths) {
      for (const file of readdir(directory).filter((entry) =>
        /\.(?:js|ts)$/.test(entry),
      )) {
        const path = resolve(file);
        const resolved = require.resolve(path);
        delete require.cache[resolved];
      }
      await this.load(directory);
    }
  }

  public async load(directory: string): Promise<void> {
    const resolvedDirectory = resolve(directory);
    this.paths.add(resolvedDirectory);

    for (const file of readdir(resolvedDirectory).filter((entry) =>
      /\.(?:js|ts|ass)$/.test(entry),
    )) {
      const path = resolve(file);
      const commands = FileReader.read<T>(path);
      await this.addPath(true, path, ...commands);
    }
  }

  public add(...commands: (IBaseCommand<T> | BaseCommand<T>)[]): Promise<void> {
    return this.addPath(false, undefined, ...commands);
  }

  public get count(): number {
    let count = 0;
    for (const commands of this.commands.values()) count += commands.length;
    return count;
  }

  public get(
    type: T,
    filter?: (command: BaseCommand<T>) => boolean,
  ): BaseCommand<T>[] {
    const commands = this.commands.get(type) ?? [];
    return filter ? commands.filter(filter) : [...commands];
  }

  public toArray(): BaseCommand<T>[] {
    return Array.from(this.commands.values()).flat();
  }

  private async addPath(
    unloadable: boolean,
    path: string | undefined,
    ...commands: (IBaseCommand<T> | BaseCommand<T>)[]
  ): Promise<void> {
    for (const input of commands) {
      const command =
        input instanceof BaseCommand
          ? input
          : new BaseCommand<T>({ ...input, path });
      if (path) command.setPath(path);
      command.validate();

      if (!this.client.events.has(this.handlerName, command.type)) {
        console.warn(
          `Command uses event "${command.type}", but no "${this.handlerName}" listener is registered.`,
        );
      }

      command.data.unloadable = unloadable;
      const transpiled = await Transpiler.transpile(command.data.code, {
        client: this.client,
        terminator: Code.reservedNames.context,
        ignoreText: false,
        minify: true,
      });
      command.setTranspiled(transpiled);
      const group = this.commands.get(command.type) ?? [];
      group.push(command);
      this.commands.set(command.type, group);
    }

    this.emit("update");
  }
}
