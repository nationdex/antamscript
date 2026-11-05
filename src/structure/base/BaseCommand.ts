import type { ClientEvents } from "discord.js";
import { TranspiledResult } from "../../core/Transpiler";

export type CommandType = keyof ClientEvents;

export interface IBaseCommand<T extends string = CommandType> {
  [key: string]: unknown;
  type: T;
  code: string;
  name?: string;
  aliases?: string[];
  allowBots?: boolean;
  nameCaseInsensitive?: boolean;
  path?: string;
  unloadable?: boolean;
}

export class BaseCommand<T extends string = CommandType> {
  public readonly data: IBaseCommand<T>;
  public transpiled: TranspiledResult | null = null;

  public constructor(data: IBaseCommand<T>) {
    this.data = { ...data };
  }

  public get name(): string {
    return (
      this.data.name ??
      this.data.path
        ?.split(/[\\/]/)
        .pop()
        ?.replace(/\.[^.]+$/, "") ??
      ""
    );
  }

  public get type(): T {
    return this.data.type;
  }

  public setTranspiled(transpiled: TranspiledResult | null): void {
    this.transpiled = transpiled;
  }

  public setPath(path: string): void {
    this.data.path = path;
  }

  public validate(): void {
    if (typeof this.data.type !== "string" || this.data.type.length === 0) {
      throw new TypeError("Command type must be a non-empty event name.");
    }
    if (typeof this.data.code !== "string" || this.data.code.length === 0) {
      throw new TypeError(
        `Command "${this.name || "(unnamed)"}" must have non-empty code.`,
      );
    }
  }
}
