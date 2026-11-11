import { deserialize, serialize } from "node:v8";
import { AntamFunction, IAntamFunction } from "../structure/@internal/AntamFunction";
import { Arrayable } from "../utils/typings";
import readdir from "../utils/readdir";
import { ArgType, IArg } from "../structure/@internal/Arg";
import { ISimplifiedFunctionDefination, Parser } from "../core";
import { enumToArray } from "../utils/enum";
import { createRequire } from "node:module";
import nativeFunctions from "../functions/list";
import { relative } from "node:path";

const require = createRequire(import.meta.url);

export class FunctionManager {
  private static readonly Functions = new Map<string, AntamFunction<any>>();

  public static loadNative() {
    this.addMany(nativeFunctions.filter((fn) => !this.Functions.has(fn.name)));
  }

  public static load(provider: string, path: string): void;
  public static load(path: string): void;
  public static load(provider: string, path?: string) {
    if (!path) return this.load("Unknown", provider);

    const overrideAttempts = new Array<string>();
    const loader = new Array<AntamFunction<any>>();
    for (const file of readdir(path).filter((x) => x.endsWith(".js") || x.endsWith(".ts"))) {
      const req = require(file).default as AntamFunction<any>;
      req.path = file;
      const category = relative(path, file).split("\\").slice(0, -1);
      req.category = category;

      if (this.Functions.has(req.name)) {
        overrideAttempts.push(req.name);
        continue;
      }

      loader.push(req);
    }

    this.addMany(loader);

    if (overrideAttempts.length !== 0)
      console.warn(
        `${provider} | Attempted to override the following ${overrideAttempts.length} functions: ${overrideAttempts.join(", ")}`,
      );
  }

  public static addMany(...fns: Arrayable<AntamFunction<any>>[]): void {
    for (let i = 0, len = fns.length; i < len; i++) {
      const fn = fns[i];
      if (Array.isArray(fn)) this.addMany(...fn);
      else this.Functions.set(fn.name, fn);
    }
    this.reload();
  }

  public static add(fn: AntamFunction<any>) {
    return this.addMany(fn);
  }

  public static reload() {
    Parser["setFunctions"](this.raw);
  }

  public static get<T extends [...IArg[]] = IArg[]>(name: string) {
    return this.Functions.get(name) as AntamFunction<T> | undefined;
  }

  public static toJSON(): IAntamFunction<IArg[]>[] {
    return Array.from(this.Functions.values()).map((x) => {
      const d = { ...x.data, category: x.category };
      Reflect.deleteProperty(d, "transpile");
      Reflect.deleteProperty(d, "importFunctions");
      const data = deserialize(new Uint8Array(serialize(d))) as IAntamFunction<any>;

      data.args?.map((x) => {
        if (x.enum) x.enum = enumToArray(x.enum);
      });

      return data;
    });
  }

  public static get raw(): ISimplifiedFunctionDefination[] {
    return Array.from(this.Functions).map((x) => simplifyFunction(x[1]));
  }
}

export function simplifyFunction(f: AntamFunction<any>): ISimplifiedFunctionDefination {
  const { data } = f;
  return {
    name: data.name,
    aliases: data.aliases ?? [],
    params: data.brackets ?? undefined,
  };
}
