import { Transpiler, type ITranspilerOptions } from "../core/Transpiler";
import { FunctionManager } from "./FunctionManager";
import {
  CustomAntamFunction,
  type ICustomAntamFunction,
} from "../structure/antam/CustomAntamFunction";
import readdir from "../utils/readdir";
import { resolve } from "node:path";
import { AntamClient } from "../core";

export class CustomFunctionManager {
  private readonly functions = new Map<string, CustomAntamFunction>();

  public constructor(private readonly client: AntamClient) {}

  public async add(...fns: ICustomAntamFunction[]): Promise<CustomAntamFunction[]> {
    const results: CustomAntamFunction[] = [];

    for (const data of fns) {
      const existing = this.functions.get(data.name);
      if (existing) {
        console.warn(`"${data.name}" is already registered, overwriting.`);
      }

      const fn = await this.transpileAndRegister(data);
      results.push(fn);
    }

    return results;
  }

  public async load(directory: string): Promise<CustomAntamFunction[]> {
    const results: CustomAntamFunction[] = [];
    const files = readdir(resolve(directory)).filter((f) => /\.(?:js|ts)$/.test(f));

    for (const file of files) {
      const mod = await import(resolve(file));
      const exported: ICustomAntamFunction | ICustomAntamFunction[] = mod?.default ?? mod;

      const defs = Array.isArray(exported) ? exported : [exported];
      for (const def of defs) {
        if (!def?.name || !def?.code) {
          console.warn(`Skipping "${file}", missing "name" or "code".`);
          continue;
        }
        def.path ??= resolve(file);
        const loaded = await this.add(def);
        results.push(...loaded);
      }
    }

    return results;
  }

  private async transpileAndRegister(
    data: ICustomAntamFunction,
    overwrite = true,
  ): Promise<CustomAntamFunction> {
    const fn = new CustomAntamFunction(data);

    fn.transpiled = await Transpiler.transpile(data.code, {
      minify: true,
      ignoreText: false,
    } satisfies ITranspilerOptions);

    this.functions.set(data.name, fn);

    if (overwrite) {
      // @ts-ignore
      FunctionManager["Functions"]?.delete(data.name);
    }
    FunctionManager.add(fn.asAntamFunction());
    return fn;
  }
}
