import { Parser } from "../../core";

// biome-ignore lint/complexity/noStaticOnlyClass: Code is the static code-generation API.
export class Code {
  static readonly reservedNames = {
    context: "$ctx",
    client: "$client",
    command: "$command",
    discord: "$discord",
    transpiler: "$transpiler",
    data: "__data__",
  } as const;

  static propertyAccess(object: string, property: string): string {
    return `${Code.parenthesize(object)}[${Code.stringLiteral(property)}]`;
  }

  static callExpression(callee: string, args: string[] = []): string {
    return `${Code.parenthesize(callee)}(${args.join(", ")})`;
  }

  static binaryExpression(lhs: string, operator: string, rhs: string): string {
    return `${Code.parenthesize(lhs)} ${operator} ${Code.parenthesize(rhs)}`;
  }

  static methodCall(
    code: string,
    method: string,
    args?: { string: boolean; value: string }[],
    opts: { stringMethod?: boolean } = {},
  ) {
    const methodAccess =
      opts.stringMethod === false
        ? `${Code.parenthesize(code)}[${method}]`
        : Code.propertyAccess(code, method);
    return Code.callExpression(
      methodAccess,
      args?.map((arg) => (arg.string ? Code.stringLiteral(arg.value) : arg.value)),
    );
  }

  static stringLiteral(value: string) {
    return JSON.stringify(Code.unwrapString(value));
  }

  static parenthesize(expression: string): string {
    return `(${expression})`;
  }

  static contextContent = {
    _: `${Code.reservedNames.context}["content"]` as const,
    append(s: string, plain = true) {
      return `${this._} += ${plain ? Code.stringLiteral(s) : s} ?? ""`;
    },
    appendExpr(code: string): string {
      return this.append(Code.parenthesize(code), false);
    },
    clear() {
      return `${this._} = ""`;
    },
    replace(s: [string, string], plain = [true, true]) {
      return Code.methodCall(this._, "replace", [
        { string: plain[0], value: s[0] },
        { string: plain[1], value: s[1] },
      ]);
    },
    get() {
      return this._;
    },
  };

  static joinArguments(argsArrayCode: string, sep = Parser.GlobalFunctionConfig.argSplitter) {
    return `${Code.parenthesize(argsArrayCode)}.join(${Code.stringLiteral(sep)})`;
  }

  static comparisonExpression(
    lhs: [unknown, boolean?],
    rhs: [unknown, boolean?],
    operator: string,
  ) {
    return Code.binaryExpression(
      lhs[1] ? Code.stringLiteral(String(lhs[0])) : String(lhs[0]),
      operator,
      rhs[1] ? Code.stringLiteral(String(rhs[0])) : String(rhs[0]),
    );
  }

  static randomVariable(length = 8): string {
    length = Math.max(length, 6);
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let name = "$";
    for (let i = 0; i < length; i++) {
      name +=
        chars[Math.floor(Math.random() * chars.length)][
          Math.random() < 0.5 ? "toLowerCase" : "toUpperCase"
        ]();
    }
    return name;
  }

  static forLoop(iterations: number | string, body: string) {
    const index = Code.randomVariable();
    return `for(let ${index} = 0;${index} < Number(${iterations}); ${index}++) { ${body} }`;
  }

  static unwrapString(value: string) {
    return Code.isStringWrapped(value) ? (JSON.parse(value) as string) : value;
  }

  static isStringWrapped(value: string) {
    if (!/^"(?:\\.|[^"\\])*"$/.test(value)) return false;
    try {
      return typeof JSON.parse(value) === "string";
    } catch {
      return false;
    }
  }

  static variablePlaceholder(name: string) {
    return `__$$${name}$$__`;
  }
}
