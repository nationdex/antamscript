import { AntamError, ErrorType } from "../structure/antam/AntamError";

export interface ISimplifiedFunctionDefination {
  name: string;
  aliases?: string[];
  /**
   * undefined -> strictly no args   ($ping; `$ping[x]` = function + text "[x]")
   * true      -> args required      ($foo[a;b]; bare `$foo` is plain text)
   * false     -> args optional      ($foo or $foo[a])
   */
  params?: boolean;
}
export enum FunctionOperator {
  /** Disables the output of the function */
  Negate = "negate",
  /** Disables errors for the function */
  Silent = "silent",
  /** Counts the items after splitting by the operator arg: $@[sep]fn[...] */
  Count = "count",
}

/** Operators that take args. All others take none. */
const OPERATOR_ARGS: Record<FunctionOperator, boolean> = {
  [FunctionOperator.Negate]: false,
  [FunctionOperator.Silent]: false,
  [FunctionOperator.Count]: true,
};

export interface IGlobalFunctionConfig {
  functionHead: string;
  parentheses: [string, string];
  escape: string;
  argSplitter: string;
  /** Single-character operator -> operator type */
  operators: Record<string, FunctionOperator>;
  /** Operators must appear in this order, each at most once */
  operatorOrder: FunctionOperator[];
  /** If true, unknown functions are treated as text; if false, throws an error */
  ignoreUnknownFunction: boolean;
  /** If true, missing required args are treated as text; if false, throws an error */
  ignoreMissingArgs: boolean;
}

interface FunctionOperatorNode {
  raw: string;
  type: FunctionOperator;
  args: Node[][] | null;
}

export interface FunctionNode {
  type: "function";
  operators: FunctionOperatorNode[];
  name: string;
  args: Node[][] | null;
  raw: string;
}

export interface TextNode {
  type: "text";
  value: string;
  raw: string;
}

export type Node = TextNode | FunctionNode;

export interface ParsedCondition {
  operator: "unknown" | "==" | "!=" | "<" | "<=" | ">" | ">=";
  lhs: Node[];
  rhs: Node[] | null;
}

interface TrieNode {
  children: Map<string, TrieNode>;
  def?: ISimplifiedFunctionDefination;
}

interface Ctx {
  cfg: IGlobalFunctionConfig;
  root: TrieNode;
}

interface NodesResult {
  nodes: Node[];
  end: number;
  stop: "end" | "split" | "close";
}

export interface ParsedResult {
  ast: Node[];
  fns: Set<string>;
}

export class Parser {
  public static GlobalFunctionConfig: IGlobalFunctionConfig = {
    functionHead: "$",
    parentheses: ["[", "]"],
    escape: "\\",
    argSplitter: ";",
    operators: {
      "!": FunctionOperator.Negate,
      "#": FunctionOperator.Silent,
      "@": FunctionOperator.Count,
    },
    operatorOrder: [
      FunctionOperator.Negate,
      FunctionOperator.Silent,
      FunctionOperator.Count,
    ],
    ignoreUnknownFunction: false,
    ignoreMissingArgs: false,
  };
  private static funcs: ISimplifiedFunctionDefination[] = [];
  private static readonly trieCache = new WeakMap<
    ISimplifiedFunctionDefination[],
    TrieNode
  >();

  private constructor() {}

  private static setFunctions(functions: ISimplifiedFunctionDefination[]) {
    this.funcs = functions;
    // @ts-ignore
    this["trieCache"] = new WeakMap();
  }

  static parse(
    input: string,
    functions: ISimplifiedFunctionDefination[] = [],
    config: Partial<IGlobalFunctionConfig> = {},
  ): ParsedResult {
    const functionsList = [...this.funcs, ...functions];
    let root = this.trieCache.get(functionsList);
    if (!root) {
      root = this.buildTrie(functionsList);
      this.trieCache.set(functionsList, root);
    }
    const ctx: Ctx = {
      cfg: { ...Parser.GlobalFunctionConfig, ...config },
      root,
    };
    return this.createParsedResult(
      this.parseNodes(input, 0, ctx, false).nodes,
      functionsList,
    );
  }

  private static createParsedResult(
    nodes: Node[],
    functionsList: ISimplifiedFunctionDefination[],
  ) {
    let result: ParsedResult = {
      ast: nodes,
      fns: new Set(),
    };

    let nodeQueue: FunctionNode[] = nodes.filter((v) => v.type === "function");
    while (nodeQueue.length > 0) {
      let node = nodeQueue.shift();
      if (!node) break;
      result.fns.add(node.name);

      if (node.args?.length)
        nodeQueue.splice(
          nodeQueue.length - 1,
          0,
          ...node.args.flat(1).filter((n) => n.type === "function"),
        );
    }

    return result;
  }

  /** Case-fold one UTF-16 unit, never changing length. */
  private static fold(c: string): string {
    const l = c.toLowerCase();
    return l.length === 1 ? l : c;
  }

  private static buildTrie(
    functions: ISimplifiedFunctionDefination[],
  ): TrieNode {
    const root: TrieNode = { children: new Map() };
    for (const def of functions) {
      // Add the main name
      this.addToTrie(root, def.name, def);

      // Add all aliases
      if (def.aliases) {
        for (const alias of def.aliases) {
          this.addToTrie(root, alias, def);
        }
      }
    }
    return root;
  }

  private static addToTrie(
    root: TrieNode,
    name: string,
    def: ISimplifiedFunctionDefination,
  ): void {
    let node = root;
    for (let i = 0; i < name.length; i++) {
      const ch = this.fold(name[i]);
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map() };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.def ??= def;
  }

  private static candidates(
    input: string,
    pos: number,
    root: TrieNode,
  ): { def: ISimplifiedFunctionDefination; len: number }[] {
    let found: { def: ISimplifiedFunctionDefination; len: number }[] | null =
      null;
    let node = root;
    for (let i = pos; i < input.length; i++) {
      const next = node.children.get(this.fold(input[i]));
      if (!next) break;
      node = next;
      if (node.def) (found ??= []).push({ def: node.def, len: i - pos + 1 });
    }
    return found ? found.reverse() : [];
  }

  static parseCondition(nodes: Node[]): ParsedCondition {
    const operators = ["==", "!=", "<=", ">=", "<", ">"] as const;
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      if (node.type !== "text") continue;

      for (let valueIndex = 0; valueIndex < node.value.length; valueIndex++) {
        const operator = operators.find((candidate) =>
          node.value.startsWith(candidate, valueIndex),
        );
        if (!operator) continue;

        const rawStart = this.rawOffsetForValueIndex(node, valueIndex);
        const { escape } = this.GlobalFunctionConfig;
        if (node.raw.slice(0, rawStart).endsWith(escape)) continue;
        const rawEnd = this.rawOffsetForValueIndex(
          node,
          valueIndex + operator.length,
        );
        const lhs = nodes.slice(0, nodeIndex);
        const rhs = nodes.slice(nodeIndex + 1);
        const lhsText = {
          type: "text" as const,
          value: node.value.slice(0, valueIndex),
          raw: node.raw.slice(0, rawStart),
        };
        const rhsText = {
          type: "text" as const,
          value: node.value.slice(valueIndex + operator.length),
          raw: node.raw.slice(rawEnd),
        };
        if (lhsText.value || lhsText.raw) lhs.push(lhsText);
        if (rhsText.value || rhsText.raw) rhs.unshift(rhsText);

        return {
          operator,
          lhs: this.withoutEmptyText(lhs),
          rhs: this.withoutEmptyText(rhs),
        };
      }
    }

    return {
      operator: "unknown",
      lhs: this.withoutEmptyText(nodes),
      rhs: null,
    };
  }

  private static rawOffsetForValueIndex(node: TextNode, valueIndex: number) {
    const { escape } = this.GlobalFunctionConfig;
    let rawIndex = 0;
    let parsedIndex = 0;

    while (rawIndex < node.raw.length && parsedIndex < valueIndex) {
      if (node.raw.startsWith(escape, rawIndex)) rawIndex += escape.length;
      rawIndex++;
      parsedIndex++;
    }

    return rawIndex;
  }

  private static withoutEmptyText(nodes: Node[]) {
    return nodes.filter(
      (node) => node.type !== "text" || node.value.length > 0,
    );
  }

  private static matchFunction(
    input: string,
    i: number,
    ctx: Ctx,
  ): { node: FunctionNode; end: number } | null {
    const { cfg } = ctx;
    const [open] = cfg.parentheses;

    let pos = i + cfg.functionHead.length;
    let lastIdx = -1;
    const states: { pos: number; ops: FunctionOperatorNode[] }[] = [
      { pos, ops: [] },
    ];

    while (pos < input.length) {
      const ch = input[pos];
      const type = cfg.operators[ch];
      if (type === undefined) break;

      const idx = cfg.operatorOrder.indexOf(type);
      if (idx <= lastIdx) break;

      let args: Node[][] | null = null;
      let end = pos + ch.length;

      if (OPERATOR_ARGS[type]) {
        if (!input.startsWith(open, end)) break;
        const parsed = this.parseArgs(input, end + open.length, ctx);
        if (!parsed) break;
        args = parsed.args;
        end = parsed.end;
      }

      const ops = [
        ...states[states.length - 1].ops,
        { raw: input.slice(pos, end), type, args },
      ];
      states.push({ pos: end, ops });
      lastIdx = idx;
      pos = end;
    }

    for (let s = states.length - 1; s >= 0; s--) {
      const m = this.matchNamed(input, i, states[s].pos, states[s].ops, ctx);
      if (m) return m;
    }

    return null;
  }

  private static matchNamed(
    input: string,
    i: number,
    nameStart: number,
    operators: FunctionOperatorNode[],
    ctx: Ctx,
  ): { node: FunctionNode; end: number } | null {
    const { cfg, root } = ctx;
    const [open] = cfg.parentheses;

    const candidates = this.candidates(input, nameStart, root);

    if (candidates.length === 0 && !cfg.ignoreUnknownFunction) {
      const guessEnd = (input: string, start: number) => {
        let i = start;
        while (i < input.length) {
          const ch = input[i];
          if (/[A-Za-z0-9_]/.test(ch)) i++;
          else break;
        }
        return i;
      };
      const rawUnknown = input.slice(i, guessEnd(input, nameStart));
      throw new AntamError(
        rawUnknown,
        ErrorType.UnknownFunctionAtPosition,
        i,
        rawUnknown,
      );
    }

    for (const { def, len } of candidates) {
      const after = nameStart + len;
      const make = (args: Node[][] | null, end: number) => ({
        node: {
          type: "function" as const,
          operators,
          name: def.name,
          args,
          raw: input.slice(i, end),
        },
        end,
      });

      if (def.params === undefined) return make(null, after);

      if (input.startsWith(open, after)) {
        const parsed = this.parseArgs(input, after + open.length, ctx);
        if (parsed) return make(parsed.args, parsed.end);
      }

      if (def.params === true) {
        if (!cfg.ignoreMissingArgs) {
          throw new AntamError(
            `${Parser.GlobalFunctionConfig.functionHead}${def.name}`,
            ErrorType.RequiresArgumentsAtPosition,
            def.name,
            i,
          );
        }
        continue;
      }

      if (def.params === false) return make(null, after);
    }

    return null;
  }

  private static parseNodes(
    input: string,
    start: number,
    ctx: Ctx,
    inArg: boolean,
  ): NodesResult {
    const { cfg } = ctx;
    const [open, close] = cfg.parentheses;
    const nodes: Node[] = [];
    let raw = "";
    let value = "";
    let depth = 0;
    let i = start;

    const flush = () => {
      if (raw) {
        nodes.push({ type: "text", value, raw });
        raw = "";
        value = "";
      }
    };

    while (i < input.length) {
      const char = input[i];

      if (char === cfg.escape && i + 1 < input.length) {
        raw += char + input[i + 1];
        value += input[i + 1];
        i += 2;
        continue;
      }

      if (inArg) {
        if (char === open) depth++;
        else if (char === close) {
          if (depth === 0) {
            flush();
            return { nodes, end: i, stop: "close" };
          }
          depth--;
        } else if (char === cfg.argSplitter && depth === 0) {
          flush();
          return { nodes, end: i, stop: "split" };
        }
      }

      if (input.startsWith(cfg.functionHead, i)) {
        const m = this.matchFunction(input, i, ctx);
        if (m) {
          flush();
          nodes.push(m.node);
          i = m.end;
          continue;
        }
      }

      raw += char;
      value += char;
      i++;
    }

    flush();
    return { nodes, end: i, stop: "end" };
  }

  private static parseArgs(
    input: string,
    start: number,
    ctx: Ctx,
  ): { args: Node[][]; end: number } | null {
    const args: Node[][] = [];
    let i = start;

    while (true) {
      const r = this.parseNodes(input, i, ctx, true);
      if (r.stop === "end") return null; // unclosed bracket
      args.push(r.nodes);
      if (r.stop === "close") {
        return { args, end: r.end + ctx.cfg.parentheses[1].length };
      }
      i = r.end + ctx.cfg.argSplitter.length;
    }
  }
}
