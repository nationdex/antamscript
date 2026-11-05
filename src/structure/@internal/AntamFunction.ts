import {
  getGlobalImportedFunctions,
  GlobalFunctionsNames,
} from "../../functions/imported";
import { Arrayable, EnumLike } from "../../utils/typings";
import { ArgType, IArg, UnwrapArgs } from "./Arg";
import { Context } from "./Context";
import { Return } from "./Return";
import { TranspiledFunction } from "./TranspiledFunction";

export enum FunctionFlags {
  Experimental,
  Deprecated,
}

export type FunctionOutputType<E = any> =
  | Arrayable<ArgType | EnumLike<E> | "void">
  | "void";

export enum FunctionType {
  Scope,
  Getter,
  Setter,
  Function,
  FunctionGetter,
  ScopeGetter,
}

export type AntamFunctionTranspiler<T extends [...IArg[]]> = (
  this: TranspiledFunction<T>,
  ctx: Context,
  args: UnwrapArgs<T>,
) => Promise<Return> | Return;

export interface IAntamFunction<T extends [...IArg[]]> {
  name: string;
  aliases?: string[];
  description: string;
  type: FunctionType;
  flags?: FunctionFlags;

  args?: [...T];
  output: FunctionOutputType;

  importFunctions?: ([string, Function] | GlobalFunctionsNames)[];

  /**
   * If `undefined`, function has no brackets.
   *
   * If `false`, function can have brackets.
   *
   * If `true`, function must have brackets.
   */
  brackets?: boolean;
  transpile: AntamFunctionTranspiler<T>;
}

export class AntamFunction<T extends [...IArg[]] = IArg[]> {
  public readonly async: boolean;
  public path!: string;

  public constructor(public readonly data: IAntamFunction<T>) {
    // @ts-ignore
    this.async = data.transpile[Symbol.toStringTag] === "AsyncFunction";

    if (this.data.args)
      this.data.args = this.data.args.map((arg) => ({
        condition: false,
        raw: false,
        required: false,
        ...arg,
      })) as unknown as [...T];
  }

  public get name() {
    return this.data.name;
  }

  public get transpile() {
    return this.data.transpile;
  }

  public get importFunctions(): [string, string][] {
    return (
      this.data.importFunctions?.map((x) =>
        Array.isArray(x)
          ? [x[0], typeof x[1] === "string" ? x[1] : `(${x[1].toString()})`]
          : (() => {
              const imported = getGlobalImportedFunctions(x);
              const found = imported[0];
              if (!found)
                throw new Error(`Global import function "${x}" not found`);
              return [found[0], `(${found[1].toString()})`];
            })(),
      ) ?? []
    );
  }
}
