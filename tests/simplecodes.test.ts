import { describe, it } from "node:test";

import { Context, FunctionManager, Scope } from "../src/index";
import { Transpiler } from "../src/core/Transpiler";

// ─── Setup ────────────────────────────────────────────────────────────────────

describe("Transpiler Examples", async () => {
  FunctionManager.loadNative();

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
  };

  function header(title: string) {
    const bar = "═".repeat(60);
    console.log(`\n${C.cyan}${bar}${C.reset}`);
    console.log(` ${C.cyan}${C.bold}${title}${C.reset}`);
    console.log(`${C.cyan}${bar}${C.reset}\n`);
  }

  function section(label: string, value: string) {
    console.log(` ${C.yellow}▸ ${label}${C.reset}`);
    console.log(` ${C.gray}${"-".repeat(56)}${C.reset}`);
    const lines = value.split("\n").join(`\n ${C.gray}`);
    console.log(` ${C.gray}${lines}${C.reset}\n`);
  }

  async function trans(source: string) {
    const res = await Transpiler.transpile(source, {
      terminator: `$ctx`,
      minify: true,
    });

    section("Source", res.input);
    section("Generated", res.minifiedCode ?? res.code);

    let i = res.parsed.ast.at(-1);
    if (i?.type === "function") {
      console.log(i.args[1]);
    }

    const result = await res.run({
      ctx: new Context({ scope: Scope.globalScope() }),
    });

    const formatted = typeof result === "string" ? result : JSON.stringify(result, null, 2);

    section("Output", formatted ?? "(void)");
    console.log(` ${C.green}✔ OK${C.reset}\n`);
  }

  async function run(title: string, source: string) {
    header(title);
    try {
      await trans(source);
    } catch (err: any) {
      console.log(` ${C.red}✖ Failed: ${err.message}${C.reset}\n`);
      throw err;
    }
  }

  it("simple code #1", () =>
    run(
      "Simple Code #1",
      `$let[value;$random[1;50]]
      $if[$get[value]>25;
        $log[Greater than 25: $get[value]]
      ;
        $log[Less than or equal to 25: $get[value]]
      ]`,
    ));
});
