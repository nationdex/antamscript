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
      terminator: `$ctx.content`,
      minify: true,
    });

    section("Source", res.input);
    section("Generated", res.minifiedCode ?? res.code);

    const result = await res.run({
      ctx: new Context({ scope: Scope.globalScope() }),
      djs: require("discord.js"),
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

  // ─── Logging ──────────────────────────────────────────────────────────────

  it("$log — basic console output", () =>
    run("$log — basic console output", `$log[Hello, world!]`));

  it("$log — multiple args", () => run("$log — multiple args", `$log[one; two; three]`));

  // ─── String ───────────────────────────────────────────────────────────────

  it("$lower — single string", () =>
    run("$lower — single string", `$lower[ANTAMSCRIPT IS AWESOME]`));

  it("$lower — nested inside $log", () =>
    run("$lower — nested inside $log", `$log[result: $lower[HELLO WORLD]]`));

  it("$upper — basic", () => run("$upper — basic", `$upper[antamscript]`));

  it("$upper — nested with $lower", () =>
    run("$upper — nested with $lower", `$log[$upper[$lower[MiXeD CaSe]]]`));

  it("$trim — removes surrounding whitespace", () =>
    run("$trim — removes surrounding whitespace", `$log[$trim[   hello world   ]]`));

  it("$textLength — string length", () =>
    run("$textLength — string length", `$log[length of 'hello': $textLength[hello]]`));

  it("$replace — replaces first occurrence", () =>
    run("$replace — replaces first occurrence", `$log[$replace[hello world;world;antam]]`));

  // ─── Math ─────────────────────────────────────────────────────────────────

  it("$add — sum of numbers", () => run("$add — sum of numbers", `$log[$add[10; 20; 5]]`));

  it("$sub — subtraction", () => run("$sub — subtraction", `$log[$sub[100; 30; 7]]`));

  it("$multi — multiplication", () => run("$multi — multiplication", `$log[$multi[3; 4; 5]]`));

  it("$random — random number in range", () =>
    run("$random — random number in range [1, 10]", `$log[random roll: $random[1; 10]]`));

  // ─── Statements ───────────────────────────────────────────────────────────

  it("$loop — runs code N times", () => run("$loop — runs code N times", `$loop[3; $log[ping]]`));

  it("$loop — with nested expressions", () =>
    run("$loop — with nested expressions", `$loop[4; $log[$upper[round]]]`));

  it("$if — truthy branch", () => run("$if — truthy branch", `$if[1; $log[condition was true]]`));

  it("$if — falsy branch (else)", () =>
    run("$if — falsy branch (else)", `$if[0; $log[should not print]; $log[else branch executed]]`));

  // ─── Combinations ─────────────────────────────────────────────────────────

  it("combination — math inside log", () =>
    run("combination — math inside log", `$log[3 + 4 * 5 = $add[3; $multi[4; 5]]]`));

  it("combination — loop with random", () =>
    run("combination — loop with random", `$loop[3; $log[roll: $random[1; 6]]]`));

  it("combination — string pipeline", () =>
    run("combination — string pipeline", `$log[$trim[$lower[  HELLO ANTAM  ]]]`));

  it("combination — replace then upper", () =>
    run("combination — replace then upper", `$log[$upper[$replace[hello world; world; antam]]]`));

  // ─── Operators ────────────────────────────────────────────────────────────

  it("! (negate) operator — suppresses output", () =>
    run("! (negate) operator — suppresses output", `$!lower[THIS IS SUPPRESSED]rest of text`));

  it("@[sep] (count) operator — counts words", () =>
    run(
      "@[sep] (count) operator — counts words",
      `$log[$@[ ]lower[how many words are here] words]`,
    ));

  // ─── $typeof ───────────────────────────────────────────────────────────
  it("$typeof — returns the type of a value", () =>
    run(
      "$typeof — returns the type of a value",
      `$log[Type of 42: $typeof[42]; Type of 'hello': $typeof[hello]; Type of true: $typeof[true]]`,
    ));
});
