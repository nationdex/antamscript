import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CommandType, IBaseCommand } from "../structure/base/BaseCommand";
import { parseStringToData } from "../utils/parseData";

const require = createRequire(import.meta.url);

export class FileReader {
  public static read<T extends string = CommandType>(path: string): IBaseCommand<T>[] {
    const resolvedPath = resolve(path);
    if (resolvedPath.endsWith(".ass")) {
      return this.parseAntamScript<T>(readFileSync(resolvedPath, "utf8"));
    }

    const exported = require(resolvedPath) as { default?: unknown } | unknown;
    const value =
      typeof exported === "object" && exported !== null && "default" in exported
        ? exported.default
        : exported;

    if (Array.isArray(value)) return value as IBaseCommand<T>[];
    return [value as IBaseCommand<T>];
  }

  private static parseAntamScript<T extends string>(source: string): IBaseCommand<T>[] {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const commands: IBaseCommand<T>[] = [];
    let index = 0;

    while (index < lines.length) {
      const header = lines[index].match(/^\s*@([A-Za-z_$][\w$]*)\s*\{\s*$/);
      if (!header) {
        if (lines[index].trim()) {
          throw new SyntaxError(`Expected an @event{ block at line ${index + 1}.`);
        }
        index++;
        continue;
      }

      const type = header[1] as T;
      const properties: Record<string, unknown> = {};
      let code: string[] | undefined;
      index++;

      for (; index < lines.length; index++) {
        const line = lines[index];
        if (line.trim() === "}") break;

        if (code) {
          code.push(line);
          continue;
        }

        if (!line.trim()) continue;
        const property = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*(.*)$/);
        if (!property) {
          throw new SyntaxError(`Expected a command property at line ${index + 1}.`);
        }

        if (property[1] === "code") {
          code = property[2] ? [property[2]] : [];
        } else {
          properties[property[1]] = parseStringToData(property[2].trim());
        }
      }

      if (index >= lines.length) throw new SyntaxError(`Unclosed @${type}{ block.`);
      if (!code) throw new SyntaxError(`Missing code property in @${type}{ block.`);

      commands.push({ ...properties, type, code: code.join("\n").trimEnd() } as IBaseCommand<T>);
      index++;
    }

    return commands;
  }
}
