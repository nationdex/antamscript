import { FunctionManager } from "../managers";
import {
  ArgType,
  Code,
  Context,
  type FunctionOutputType,
  FunctionType,
  type IArg,
  AntamError,
  ErrorType,
} from "../structure";
import {
  Conditions,
  OperatorType,
  type ITranspiledFunction,
  TranspiledFunction,
} from "../structure/@internal/TranspiledFunction";
import { minifyCode } from "../utils/minifyCode";
import { parseStringToData } from "../utils/parseData";
import type { AntamClient } from "./AntamClient";
import type { BaseCommand } from "../structure/base/BaseCommand";
import {
  FunctionOperator,
  type IGlobalFunctionConfig,
  type Node,
  type ParsedResult,
  Parser,
} from "./Parser";
import { PartialDiscordContext } from "../discordjs/typings";

export interface ITranspilerOptions {
  scopeData?: {
    functions?: [string, string][];
    name?: string;
  };
  /**
   * if true, code such as "hello $username[]" will be transpiled as it is, if false, top level textnodes are ignored
   */
  ignoreText?: boolean;
  terminator?: string;
  minify?: boolean;
  client?: AntamClient;
  parserOptions?: Partial<IGlobalFunctionConfig>;
}

export interface TranspiledResultRunData {
  ctx: Context;
  client?: AntamClient;
  command?: BaseCommand | null;
  discord?: PartialDiscordContext;
  transpiler?: typeof Transpiler;
}

export interface TranspiledResult {
  run: (data: TranspiledResultRunData) => Promise<unknown>;
  input: string;
  code: string;
  minifiedCode: string | null;
  ctx: Context;
  parsed: ParsedResult;
}

interface CompiledNodes {
  code: string;
  output: FunctionOutputType;
  literal?: string;
  numericString?: boolean;
}

interface AllowedArgumentTypes {
  types: Set<ArgType>;
  enumValues: Set<string | number>;
  allowVoid: boolean;
}

export class Transpiler {
  private static readonly DataKeys: Record<
    string,
    keyof TranspiledResultRunData
  > = {
    [Code.reservedNames.context]: "ctx",
    [Code.reservedNames.client]: "client",
    [Code.reservedNames.command]: "command",
    [Code.reservedNames.discord]: "discord",
    [Code.reservedNames.transpiler]: "transpiler",
  };

  private constructor() {}

  public static async transpile(
    code: string,
    options: ITranspilerOptions = {},
  ): Promise<TranspiledResult> {
    const minify = options.minify !== false;
    const parsed = Parser.parse(code, [], options.parserOptions);
    if (options.ignoreText === true)
      parsed.ast = parsed.ast.filter((v) => v.type !== "text");

    const ctx = new Context({
      scope: "global",
    });
    if (options.scopeData) {
      if (options.scopeData.name) ctx.scope.name = options.scopeData.name;
      for (const [name, fn] of options.scopeData.functions ?? [])
        ctx.scope.addFunction(name, fn);
    }

    let transpiledCode: string;
    if (parsed.fns.size && parsed.ast.length) {
      const res = await Transpiler.execute(parsed, ctx);

      const D = Code.reservedNames.data;
      const bindings = Object.entries(Transpiler.DataKeys).map(
        ([name, key]) => `const ${name} = ${D}.${key};`,
      );

      transpiledCode = [
        `async (${D}) => {`,
        ...bindings,
        `${Code.reservedNames.context}.startTime = performance.now()`,
        ctx.scope.scopeFunctions(),
        res.code,
        `${Code.reservedNames.context}.content = ${Code.reservedNames.context}.content.trim();`,
        `return ${
          typeof options.terminator === "string"
            ? options.terminator
            : Code.reservedNames.context
        };`,
        `}`,
      ].join("\n");
    } else
      transpiledCode = `async () => ${JSON.stringify(parsed.ast.map((x) => x.raw).join(""))}`;

    let minifiedTranspiledCode: string | null = null;
    if (minify) {
      try {
        minifiedTranspiledCode = minifyCode(
          `const run = ${transpiledCode};`,
          2,
          false,
        );
        const minifiedFunction = minifiedTranspiledCode.match(
          /^(\/\*.*\*\/\n)(?:const|let|var) run=(.+);$/,
        );
        minifiedTranspiledCode = minifiedFunction
          ? `${minifiedFunction[1] ?? ""}${minifiedFunction[2] ?? ""}` || null
          : null;
      } catch (minifyErr: unknown) {
        console.warn("Minification failed, falling back to original code");
        console.warn(
          minifyErr instanceof Error ? minifyErr.message : String(minifyErr),
        );
        minifiedTranspiledCode = null; // Fall back to original
      }
    }

    const funcstr = minifiedTranspiledCode ?? transpiledCode;

    // Executing the generated function is the transpiler's runtime contract.
    // biome-ignore lint/security/noGlobalEval: the code is generated from validated AST nodes
    const execute = eval(`const f = ${funcstr}; f`) as TranspiledResult["run"];
    const run: TranspiledResult["run"] = (data) =>
      execute({ ...data, transpiler: Transpiler });

    return {
      run,
      input: code,
      code: transpiledCode,
      minifiedCode: minifiedTranspiledCode,
      ctx,
      parsed,
    };
  }

  private static async execute(
    parsed: ParsedResult,
    ctx: Context,
    top = true,
  ): Promise<{ code: string; ctx: Context; fromData: Set<string> }> {
    const fromData = new Set<string>();
    if (top) fromData.add(Code.reservedNames.context);
    const body: string[] = [];

    for (const node of parsed.ast) {
      if (node.type === "text") {
        body.push(
          top
            ? Code.contextContent.append(node.raw)
            : Code.stringLiteral(node.raw),
        );
        continue;
      }

      const pre: string[] = [];
      const silent = node.operators.some(
        (operator) => operator.type === FunctionOperator.Silent,
      );
      try {
        const data = await Transpiler.transpileFunction(node, ctx, pre);
        if (!data) throw new Error(`Function Data not found for ${node.raw}`);

        const fn = new TranspiledFunction(data);

        const ret = await fn.execute(ctx);
        if (!ret.success) throw ret.value;

        const statements = [...pre, ...fn.declarations];

        const out = ret.value as string | null;
        if (out != null && out !== "") {
          const isVoid = fn.fn.data.output === "void";
          if (isVoid) {
            const statement = out.trimEnd().endsWith(";") ? out : `${out};`;
            statements.push(statement);
          } else {
            if (top) statements.push(Code.contextContent.appendExpr(out));
            else statements.push(out);
          }
        }

        body.push(
          ...(silent
            ? [`try { ${statements.join("\n")} } catch {}`]
            : statements),
        );
      } catch (error) {
        if (!silent) throw error;
      }
    }
    return { code: body.join("\n"), ctx, fromData };
  }

  /** Compiles one argument (a list of text/function nodes) into a JS expression. */
  private static async transpileNodes(
    nodes: Node[],
    ctx: Context,
    pre: string[],
  ): Promise<CompiledNodes> {
    const parts: string[] = [];
    const partComments: string[] = [];
    const outputs: FunctionOutputType[] = [];
    const numericParts: boolean[] = [];
    let actualComment = "";
    let literal: string | undefined;
    for (const n of nodes) {
      if (n.type === "text") {
        parts.push(Code.stringLiteral(n.value));
        partComments.push(actualComment);
        actualComment = "";
        outputs.push(ArgType.String);
        numericParts.push(
          n.value.trim() === "" || Number.isFinite(Number(n.value)),
        );
        if (nodes.length === 1) literal = n.value;
        continue;
      }
      const silent = n.operators.some(
        (operator) => operator.type === FunctionOperator.Silent,
      );
      try {
        const nestedPre: string[] = [];
        const data = await Transpiler.transpileFunction(n, ctx, nestedPre);
        if (!data) throw new Error(`Function Data not found for ${n.raw}`);

        const fn = new TranspiledFunction(data);
        const ret = await fn.execute(ctx);
        if (!ret.success) throw ret.value;
        if (fn.fn.data.type === FunctionType.Scope)
          throw new TypeError(
            `Scope function "${n.name}" cannot be used as an argument value`,
          );
        if (ret.valueType === "void" && fn.fn.name !== "c")
          throw new TypeError(
            `Function "${n.name}" does not produce an argument value`,
          );

        const expression = String(ret.value ?? "undefined");
        if (fn.fn.name === "c") {
          actualComment += `${expression} `;
        } else {
          partComments.push(actualComment);
          actualComment = "";
          outputs.push(ret.valueType);
          numericParts.push(
            Transpiler.getAllowedArgumentTypes(ret.valueType).types.has(
              ArgType.Number,
            ),
          );
          if (silent) {
            const statements = [...nestedPre, ...fn.declarations];
            parts.push(
              `(() => { try { ${statements.join("\n")} return (${expression}); } catch { return undefined; } })()`,
            );
          } else {
            pre.push(...nestedPre, ...fn.declarations);
            parts.push(expression);
          }
        }
      } catch (error) {
        if (!silent) throw error;
        parts.push("undefined");
        partComments.push(actualComment);
        actualComment = "";
        outputs.push(ArgType.Unknown);
        numericParts.push(false);
      }
    }
    if (!parts.length)
      return {
        code: actualComment + Code.stringLiteral(""),
        output: ArgType.String,
        literal: "",
      };
    return {
      code:
        (parts.length === 1
          ? `${partComments[0]}${parts[0]}`
          : `(${parts.map((part, index) => `${partComments[index]}${part}`).join(" + ")})`) +
        actualComment,
      output: parts.length === 1 ? outputs[0] : ArgType.String,
      literal,
      numericString:
        parts.length > 1 && numericParts.every((isNumeric) => isNumeric),
    };
  }

  private static async transpileFunction(
    node: Node,
    ctx: Context,
    pre: string[],
  ): Promise<ITranspiledFunction | null> {
    if (node.type !== "function") return null;
    const functionData = FunctionManager.get(node.name);
    if (!functionData) {
      throw new AntamError(null, ErrorType.UnknownFunction, node.name);
    }
    if (node.args == null && functionData.data.brackets === true) {
      throw new AntamError(functionData, ErrorType.MissingFields, node.name);
    }
    const definedArgs = functionData.data.args ?? [];
    const providedArgs = node.args ?? [];
    const bracketlessCall =
      node.args == null && functionData.data.brackets === false;
    const requiredCount = definedArgs.filter((a) => a.required === true).length;
    if (!bracketlessCall && providedArgs.length < requiredCount) {
      throw new AntamError(
        functionData,
        ErrorType.TooFewArgs,
        node.name,
        requiredCount,
        providedArgs.length,
      );
    }
    const hasRest = definedArgs.some((a) => a.rest === true);
    if (!hasRest && providedArgs.length > definedArgs.length) {
      throw new AntamError(
        functionData,
        ErrorType.TooManyArgs,
        node.name,
        definedArgs.length,
        providedArgs.length,
      );
    }

    const lastArg = definedArgs[definedArgs.length - 1];
    const fields: NonNullable<ITranspiledFunction["fields"]>[0][] = [];

    if (bracketlessCall) {
      for (const arg of definedArgs) {
        if (arg.rest) break;
        fields.push({
          code: "undefined",
          arg,
          resolve: () => "undefined",
        });
      }
    }

    for (let i = 0; i < providedArgs.length; i++) {
      const arg = definedArgs[i] ?? (hasRest ? lastArg : undefined);
      if (!arg) break;

      if (arg.raw) {
        const rawNodes = providedArgs[i];
        const rawSource = rawNodes.map((n) => n.raw).join("");
        fields.push({
          code: Code.stringLiteral(rawSource),
          nodes: rawNodes,
          arg,
          resolve: () => Code.stringLiteral(rawSource),
        });
        continue;
      }

      let compiled: CompiledNodes;
      if (arg.condition) {
        const condition = Parser.parseCondition(providedArgs[i]);
        const lhs = await Transpiler.transpileNodes(condition.lhs, ctx, pre);
        const rhs = condition.rhs
          ? await Transpiler.transpileNodes(condition.rhs, ctx, pre)
          : null;
        const conditionCode = (part: CompiledNodes) =>
          part.literal === undefined
            ? part.code
            : Transpiler.conditionLiteralCode(part.literal);
        const resolve = Conditions[condition.operator as OperatorType];
        compiled = {
          code: resolve(conditionCode(lhs), rhs ? conditionCode(rhs) : ""),
          output: ArgType.Boolean,
        };
      } else {
        compiled = await Transpiler.transpileNodes(providedArgs[i], ctx, pre);
      }
      Transpiler.validateArgument(arg, compiled);
      const casted = Transpiler.castArgument(arg, compiled.code);
      fields.push({ code: casted.code, arg, resolve: () => casted.code });
      for (const [name, fn] of casted.functions)
        ctx.scope.addFunction(name, `(${fn.toString()})`);
    }

    return {
      node,
      fields: node.args == null && !bracketlessCall ? null : fields,
    };
  }

  private static conditionLiteralCode(literal: string) {
    const value = parseStringToData(literal);
    if (typeof value === "bigint") return `${value}n`;
    return value === undefined ? "undefined" : JSON.stringify(value);
  }

  private static getAllowedArgumentTypes(
    value: FunctionOutputType,
  ): AllowedArgumentTypes {
    const types = new Set<ArgType>();
    const enumValues = new Set<string | number>();
    let allowVoid = false;

    const addAllowedType = (value: unknown) => {
      if (typeof value === "number" && ArgType[value] !== undefined) {
        types.add(value);
      } else if (Array.isArray(value)) {
        for (const item of value) addAllowedType(item);
      } else if (value === "void") {
        allowVoid = true;
      } else if (value && typeof value === "object") {
        types.add(ArgType.Enum);
        for (const [key, enumValue] of Object.entries(value)) {
          if (
            !/^\d+$/.test(key) &&
            (typeof enumValue === "string" || typeof enumValue === "number")
          )
            enumValues.add(enumValue);
        }
      }
    };

    addAllowedType(value);
    return { types, enumValues, allowVoid };
  }

  private static validateArgument(arg: IArg, compiled: CompiledNodes) {
    const allowed = Transpiler.getAllowedArgumentTypes(arg.allow ?? arg.type);
    if (arg.enum) {
      const enumTypes = Transpiler.getAllowedArgumentTypes(arg.enum);
      for (const value of enumTypes.enumValues) allowed.enumValues.add(value);
      allowed.types.add(ArgType.Enum);
    }
    const isAllowedLiteral = (value: string) => {
      if (
        allowed.enumValues.size &&
        !allowed.enumValues.has(value) &&
        ![...allowed.enumValues].some(
          (enumValue) =>
            typeof enumValue === "number" && String(enumValue) === value,
        )
      )
        return false;

      for (const type of allowed.types) {
        if (type === ArgType.String || type === ArgType.Unknown) return true;
        if (
          type === ArgType.Number &&
          value.trim() !== "" &&
          Number.isFinite(Number(value))
        )
          return true;
        if (type === ArgType.Boolean && (value === "true" || value === "false"))
          return true;
        if (type === ArgType.Snowflake && /^\d{17,20}$/.test(value))
          return true;
        if (type === ArgType.Json) {
          try {
            const parsed = parseStringToData(value);
            if (parsed !== null && typeof parsed === "object") return true;
          } catch {
            // Invalid JSON literals are rejected below.
          }
        }
        if (
          type === ArgType.Enum &&
          (!allowed.enumValues.size ||
            allowed.enumValues.has(value) ||
            [...allowed.enumValues].some(
              (enumValue) =>
                typeof enumValue === "number" && String(enumValue) === value,
            ))
        )
          return true;
      }
      return allowed.allowVoid && value === "undefined";
    };

    let valid: boolean;
    if (compiled.literal !== undefined) {
      valid = isAllowedLiteral(compiled.literal);
    } else {
      const output = Transpiler.getAllowedArgumentTypes(compiled.output);
      valid =
        output.types.has(ArgType.Unknown) ||
        [...output.types].some((type) => allowed.types.has(type)) ||
        (output.types.has(ArgType.Enum) && allowed.types.has(ArgType.Enum)) ||
        (compiled.numericString === true && allowed.types.has(ArgType.Number));
    }

    if (!valid) {
      const expected = [...allowed.types].map((type) => ArgType[type]);
      if (allowed.enumValues.size)
        expected.push(`enum(${[...allowed.enumValues].join(", ")})`);
      const actual =
        compiled.literal !== undefined
          ? typeof parseStringToData(compiled.literal)
          : typeof compiled.output === "number"
            ? ArgType[compiled.output]
            : "void";
      throw new AntamError(
        null,
        ErrorType.InvalidArgType,
        arg.name,
        expected.join(" | ") || "a valid value",
        actual,
      );
    }
  }

  private static castArgument(
    arg: IArg,
    code: string,
  ): { code: string; functions: [string, Function][] } {
    switch (arg.type) {
      case ArgType.String:
        return { code: `String(${code})`, functions: [] };
      case ArgType.Snowflake:
        return {
          code: `f$resolveSnowflakeArg(${code})`,
          functions: [
            [
              "resolveSnowflakeArg",
              (arg: any) => {
                if (typeof arg == "string") return arg;
                return "id" in arg ? arg.id : String(arg);
              },
            ],
          ],
        };
      case ArgType.Number:
        return { code: `Number(${code})`, functions: [] };
      case ArgType.Boolean:
        return {
          code: `f$bool(${code})`,
          functions: [
            [
              "bool",
              (v: any) =>
                v == "true" ? true : v == "false" ? false : Boolean(v),
            ],
          ],
        };
      case ArgType.Json:
        return {
          code: `f$json(${code})`,
          functions: [
            ["json", (v: any) => (typeof v === "string" ? JSON.parse(v) : v)],
          ],
        };
      case ArgType.Enum: {
        const { enumValues } = Transpiler.getAllowedArgumentTypes(
          arg.allow ?? arg.type,
        );
        if (arg.enum) {
          const enumTypes = Transpiler.getAllowedArgumentTypes(arg.enum);
          for (const value of enumTypes.enumValues) enumValues.add(value);
        }
        const numericValues = [...enumValues].filter(
          (value): value is number => typeof value === "number",
        );
        return numericValues.length
          ? {
              code: `f$enum(${code}, [${numericValues.join(",")}])`,
              functions: [
                [
                  "enum",
                  (v: any, allowed: number[]) =>
                    typeof v === "string" &&
                    allowed.some((i) => String(i) === v)
                      ? Number(v)
                      : v,
                ],
              ],
            }
          : { code, functions: [] };
      }
      default:
        return { code, functions: [] };
    }
  }
}
