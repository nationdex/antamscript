import { TranspiledResult, TranspiledResultRunData } from "../../core/Transpiler";
import { AntamFunction, FunctionFlags, FunctionType } from "../@internal/AntamFunction";
import { AllowedArgTypePreset, ArgType, IArg, UnwrapArg } from "../@internal/Arg";

export interface ICustomAntamFunctionArg {
  name: string;
  type: ArgType;
  allow?: ArgType[];
  required?: boolean;
  rest?: boolean;
  condition?: boolean;
  raw?: boolean;
}
export interface ICustomAntamFunction {
  name: string;
  args?: Array<string | ICustomAntamFunctionArg>;
  brackets?: boolean;
  code: string;
  path?: string;
}

export class CustomAntamFunction {
  public transpiled?: TranspiledResult;

  public constructor(public readonly data: ICustomAntamFunction) {
    if (!Array.isArray(data.args)) data.args = [];
  }

  public asAntamFunction() {
    const fn = this;
    return new AntamFunction({
      name: this.data.name,
      description: "Custom function",
      type: FunctionType.FunctionGetter,
      output: ArgType.Unknown,
      args: this.data.args?.length
        ? this.data.args.map(
            (x, i) =>
              ({
                name: typeof x === "string" ? x : x.name,
                rest: typeof x === "string" ? false : !!x.rest,
                condition: typeof x === "string" ? false : !!x.condition,
                type:
                  typeof x === "string"
                    ? ArgType.String
                    : ((typeof x.type === "number" && x.type in ArgType
                        ? x.type
                        : ArgType[x.type!]) ?? ArgType.String),
                required: typeof x === "string" ? true : (x.required ?? true),
                raw: typeof x === "string" ? false : (x.raw ?? false),
                allow:
                  typeof x === "string"
                    ? AllowedArgTypePreset.Any
                    : (x.allow ?? AllowedArgTypePreset.Any),
                save: true,
                description: `${i} arg`,
              }) as IArg,
          )
        : undefined,
      brackets: this.data.brackets ?? (this.data.args?.length ? true : undefined),
      flags: FunctionFlags.CustomFunction,
      importFunctions: [
        [
          "customFunction",
          async (
            data: TranspiledResultRunData,
            fn: TranspiledResult["run"],
            ...args: [string, any][]
          ) => {
            const clonedCtx = data.ctx.clone();
            for (const arg of args) clonedCtx.scope.setEnvironment(arg[0], arg[1]);
            await fn({
              ctx: clonedCtx,
              client: data.client,
              command: data.command,
              discord: data.discord,
              transpiler: data.transpiler,
            });
            const returned = clonedCtx.returned();
            return returned !== undefined ? returned : clonedCtx.content;
          },
        ],
      ],
      async transpile(ctx, args: UnwrapArg<IArg<any, any, any, any, any, true>>[]) {
        if (!fn.transpiled) {
          throw new Error(`Custom function "${fn.data.name}" has not been transpiled yet.`);
        }

        const argPairs = (fn.data.args ?? []).map((x, i) => {
          const argName = typeof x === "string" ? x : x.name;
          const field = args[i];
          const value = field?.variable ?? "undefined";
          return `[${JSON.stringify(argName)}, ${value}]`;
        });

        const scopeFnName = `__customFn_${fn.data.name}__`;
        ctx.scope.addFunction(scopeFnName, `(${fn.transpiled.code})`);

        const call = `await f$customFunction(${this.code.reserved("data")}, f$${scopeFnName}, ${argPairs.join(", ")})`;
        return this.success(ctx, ArgType.Unknown, call);
      },
    });
  }
}
