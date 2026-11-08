import { readFileSync } from "fs";
import { describe, it } from "node:test";
import { join } from "path";

import { FunctionManager, ISimplifiedFunctionDefination, Node, Parser } from "../../src/index";
import { inspect } from "bun";
import assert from "assert";

describe("Simple Parsing Test", () => {
  FunctionManager.loadNative();

  const getExampleFile = (file: string) =>
    readFileSync(join(process.cwd(), "examples", file), "utf8");

  const examples = {
    simple: getExampleFile("simple.fsc"),
  };

  const fns: ISimplifiedFunctionDefination[] = [
    { name: "sendMessage", params: true },
    { name: "username", params: false },
  ];

  const build = (nodes: Node[]) => nodes.map((x) => x.raw).join("");

  it("defaults", () => {
    let parsed = Parser.parse(examples.simple, fns);
    console.log(inspect(parsed, { colors: true, sorted: true }));
    assert.equal(examples.simple, build(parsed.ast));
  });
});
