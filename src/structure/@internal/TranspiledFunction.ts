import { inspect } from "util";
import { AntamFunction, FunctionOutputType } from "..";
import { FunctionNode, FunctionOperator } from "../../core";
import { Node, Parser } from "../../core/Parser";
import { FunctionManager } from "../../managers";
import { ArgType, getArgName, IArg, UnwrapArgs } from "./Arg";
import { Code } from "./Code";
import { Context } from "./Context";
import { Return, ReturnType, ReturnValue } from "./Return";
import { AntamError, ErrorType } from "../antam/AntamError";

export type WrappedCode = (args: unknown[]) => string;
export type WrappedConditionCode = (lhs: unknown, rhs: unknown) => string;

export interface ITranspiledFunction {
  node: FunctionNode;
  fields:
    | null
    | (ITranspiledFunctionField | ITranspiledFunctionConditionField)[];
}

export interface ITranspiledFunctionField {
  code: string;
  arg: IArg;
  resolve: WrappedCode;
  /** Raw parsed AST nodes to re-transpile lazily. */
  nodes?: Node[];
}

export enum OperatorType {
  Eq = "==",
  NotEq = "!=",
  Lte = "<=",
  Gte = ">=",
  Gt = ">",
  Lt = "<",
  None = "unknown",
}

export const Operators = new Set<OperatorType>(
  Object.values(OperatorType) as OperatorType[],
);

export const Conditions: Record<OperatorType, WrappedConditionCode> = {
  unknown: (lhs) => `Boolean(${lhs})`,
  "!=": (lhs, rhs) =>
    Code.comparisonExpression([lhs, false], [rhs, false], "!=="),
  "==": (lhs, rhs) =>
    Code.comparisonExpression([lhs, false], [rhs, false], "=="),
  "<": (lhs, rhs) =>
    Code.comparisonExpression(
      [`Number(${lhs})`, false],
      [`Number(${rhs})`, false],
      "<",
    ),
  "<=": (lhs, rhs) =>
    Code.comparisonExpression(
      [`Number(${lhs})`, false],
      [`Number(${rhs})`, false],
      "<=",
    ),
  ">": (lhs, rhs) =>
    Code.comparisonExpression(
      [`Number(${lhs})`, false],
      [`Number(${rhs})`, false],
      ">",
    ),
  ">=": (lhs, rhs) =>
    Code.comparisonExpression(
      [`Number(${lhs})`, false],
      [`Number(${rhs})`, false],
      ">=",
    ),
};

export interface ITranspiledFunctionConditionField {
  code: string;
  arg: IArg;
  op: OperatorType;
  lhs: ITranspiledFunctionField;
  rhs?: ITranspiledFunctionField;
  resolve: WrappedConditionCode;
}

export interface IExtendedTranspiledFunction extends ITranspiledFunction {}

export class TranspiledFunction<T extends [...IArg[]] = IArg[]> {
  public readonly data: IExtendedTranspiledFunction;
  public readonly fn: AntamFunction<T>;

  /** `let x = ...;` statements for args with `save: true`. Emit before the function's code. */
  public readonly declarations: string[] = [];

  public constructor(raw: ITranspiledFunction) {
    this.fn = FunctionManager.get<T>(raw.node.name)!;
    this.data = {
      ...raw,
    };
  }

  public get hasFields() {
    return this.data.fields !== null;
  }

  public hasField(i: number) {
    return this.data.fields?.[i] != null;
  }

  public get display() {
    return `${Parser.GlobalFunctionConfig.functionHead}${this.fn.name}${this.hasFields ? `${Parser.GlobalFunctionConfig.parentheses[0]}${this.data.fields?.map((f) => f.code).join(Parser.GlobalFunctionConfig.argSplitter)}${Parser.GlobalFunctionConfig.parentheses[1]}` : ""}`;
  }

  /**
   * Resolves a single argument at the specified index.
   * @param n - The argument index to resolve
   * @returns The resolved field or undefined if not found
   */
  public resolveArg(
    n: number,
  ): ITranspiledFunctionField | ITranspiledFunctionConditionField | undefined {
    return this.data.fields?.[n];
  }

  /**
   * Resolves multiple arguments within a range.
   * @param from - Starting index (inclusive)
   * @param to - Ending index (inclusive)
   * @returns Array of resolved fields within the range
   */
  public resolveMultipleArgs(
    from: number,
    to: number,
  ): (ITranspiledFunctionField | ITranspiledFunctionConditionField)[] {
    if (from < 0 || to >= (this.data.fields?.length ?? 0) || from > to) {
      return [];
    }
    return this.data.fields!.slice(from, to + 1);
  }

  /**
   * Resolves all remaining arguments starting from a given index.
   * @param from - Starting index (inclusive)
   * @returns Array of all fields from the starting index to the end
   */
  public resolveArgsFrom(
    from: number,
  ): (ITranspiledFunctionField | ITranspiledFunctionConditionField)[] {
    if (from < 0 || !this.data.fields) return [];
    return this.data.fields.slice(from);
  }

  /**
   * Re-transpiles a deferred raw argument in place.
   * Returns `{ declarations, code }` — the declarations must be emitted
   * *inside* the block (e.g. the loop body), not hoisted to the outer scope.
   *
   * @param n - The argument index (must be a raw argument)
   * @param ctx - The current transpilation context
   */
  public async transpileCodeArg(
    n: number,
    ctx: Context,
    appendToContext = false,
  ): Promise<{ declarations: string[]; code: string } | null> {
    const field = this.data.fields?.[n] as ITranspiledFunctionField | undefined;
    if (!field || !field.arg.raw || !field.nodes) return null;

    // Lazy import to avoid circular deps at module load time
    const { Transpiler } = await import("../../core/Transpiler");
    // @ts-ignore – access private helper
    const result = await Transpiler["execute"](
      { ast: field.nodes, fns: new Set() },
      ctx,
      appendToContext,
    );

    return { declarations: [], code: result.code };
  }

  public error(ctx: Context, err: Error | string): Return<ReturnType.Error> {
    if (typeof err === "string") err = new AntamError(this, ErrorType.Custom, err);
    return new Return(ReturnType.Error, "void", err, ctx);
  }

  public async execute(ctx: Context): Promise<Return> {
    this.fn.importFunctions.forEach(([name, f]) =>
      ctx.scope.addFunction(name, f),
    );
    const resolved = await this.resolveArgs(ctx);
    if (!resolved.success) return resolved;
    return this.fn.transpile.call(this, ctx, resolved.value as UnwrapArgs<T>);
  }

  private async resolveArgs(ctx: Context): Promise<Return> {
    const defs = this.fn.data.args ?? [];
    const args: { variable?: string; code?: string }[] = [];

    if (!defs.length || (this.fn.data.brackets === false && !this.hasFields))
      return this.unsafeSuccess(ctx, "void", args as unknown as UnwrapArgs<T>);

    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];

      if (def.rest) {
        const rest = this.resolveArgsFrom(i).map((f) => f.code);
        args.push(this.pack(def, `[${rest.join(", ")}]`));
        break;
      }

      const field = this.resolveArg(i);
      if (!field) {
        if (def.required)
          return this.error(
            ctx,
            new AntamError(this, ErrorType.MissingArg, this.fn.name, def.name),
          );
        args.push(this.pack(def, "undefined"));
        continue;
      }
      args.push(this.pack(def, field.code));
    }

    return this.unsafeSuccess(ctx, "void", args as unknown as UnwrapArgs<T>);
  }

  /** save: true -> store code in a variable and expose `variable`; otherwise expose `code`. */
  private pack(def: IArg, code: string) {
    if (!def.save) return { code };
    const variable = getArgName(def);
    this.declarations.push(`let ${variable} = ${code};`);
    return { variable };
  }

  public successJSON(ctx: Context, value: Record<string, unknown>) {
    return this.success(
      ctx,
      ArgType.Json,
      typeof value !== "string"
        ? JSON.stringify(
            value,
            (key, val) => (typeof val === "bigint" ? val.toString() : val),
            4,
          )
        : value,
    );
  }

  public success(
    ctx: Context,
    valueType: FunctionOutputType,
    code: ReturnValue<ReturnType.Success> = null,
  ) {
    let out = this.isNegated()
      ? "void"
      : this.isCount()
        ? ArgType.Number
        : valueType;
    let countCode: string | null = null,
      negatedCode: string | null = null;

    if (this.isNegated()) {
      negatedCode = this.fn.async
        ? `await (async () => {${code}; return;})()`
        : `(() => {${code}; return;})()`;
    } else if (
      this.isCount() &&
      this.countOperatorSplitter() &&
      (valueType == ArgType.String ||
        valueType == ArgType.Json ||
        valueType == ArgType.Unknown)
    ) {
      countCode = `(() => f$countOperator(${code}, ${Code.stringLiteral(this.countOperatorSplitter() ?? ",")}))()`;
      ctx.scope.addFunction(
        "countOperator",
        `(arg, sep) => { const count = (v) => Array.isArray(v) ? v.length : v.split(sep).length; return typeof arg == "function" ? () => { let v = arg(); return count(v); } : count(arg); }`,
      );
    }
    return new Return(
      ReturnType.Success,
      out,
      negatedCode ?? countCode ?? code,
      ctx,
    );
  }

  public unsafeSuccess(
    ctx: Context,
    valueType: FunctionOutputType,
    value: ReturnValue<ReturnType.Success> = null,
  ) {
    return new Return(ReturnType.Success, valueType, value, ctx);
  }

  public isNegated() {
    return !!this.data.node.operators.find(
      (o) => o.type == FunctionOperator.Negate,
    );
  }

  public isSilent() {
    return !!this.data.node.operators.find(
      (o) => o.type == FunctionOperator.Silent,
    );
  }

  public isCount() {
    return !!this.data.node.operators.find(
      (o) => o.type == FunctionOperator.Count,
    );
  }

  public countOperatorSplitter() {
    return (
      this.data.node.operators
        .find((o) => o.type == FunctionOperator.Count)
        ?.args?.[0].map((v) => v.raw)
        .join("") ?? null
    );
  }
}
