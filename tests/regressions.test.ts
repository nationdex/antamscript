import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as DiscordJS from "discord.js";
import {
  AntamFunction,
  ArgType,
  Code,
  Context,
  FunctionManager,
  FunctionType,
  Scope,
} from "../src";
import type { AntamClient } from "../src/core/AntamClient";
import { Transpiler } from "../src/core/Transpiler";
import { ImportedDiscordFunctions } from "../src/discordjs/imported";
import { minifyCode } from "../src/utils/minifyCode";
import { parseStringToData } from "../src/utils/parseData";

FunctionManager.loadNative();

const modes = { fast: "fast", safe: "safe" } as const;
FunctionManager.add(
  new AntamFunction({
    name: "testMode",
    description: "Test enum argument validation",
    type: FunctionType.Getter,
    output: ArgType.String,
    brackets: true,
    args: [
      {
        name: "mode",
        description: "The mode",
        type: ArgType.Enum,
        enum: modes,
        allow: modes,
        required: true,
        rest: false,
        save: true,
      },
    ],
    transpile(ctx, [mode]) {
      return this.success(ctx, ArgType.String, mode.variable);
    },
  }),
);
FunctionManager.add(
  new AntamFunction({
    name: "testSnowflakeArg",
    description: "Test Snowflake argument validation",
    type: FunctionType.Getter,
    output: ArgType.String,
    brackets: true,
    args: [
      {
        name: "id",
        description: "Discord snowflake",
        type: ArgType.Snowflake,
        required: true,
        rest: false,
        save: false,
      },
    ],
    transpile(ctx, [id]) {
      return this.success(ctx, ArgType.String, id.code);
    },
  }),
);
FunctionManager.add(
  new AntamFunction({
    name: "testCondition",
    description: "Test condition argument parsing",
    type: FunctionType.Getter,
    output: ArgType.Boolean,
    brackets: true,
    args: [
      {
        name: "condition",
        description: "Condition expression",
        type: ArgType.Boolean,
        condition: true,
        required: true,
        rest: false,
        save: false,
      },
    ],
    transpile(ctx, [condition]) {
      return this.success(ctx, ArgType.Boolean, condition.code);
    },
  }),
);
FunctionManager.add(
  new AntamFunction({
    name: "testRaw",
    description: "Test raw argument handling",
    type: FunctionType.Getter,
    output: ArgType.String,
    brackets: true,
    args: [
      {
        name: "source",
        description: "Source text passed through without transpilation",
        type: ArgType.String,
        raw: true,
        required: true,
        rest: false,
        save: false,
      },
    ],
    transpile(ctx, [source]) {
      return this.success(ctx, ArgType.String, source.code);
    },
  }),
);

async function execute(source: string, options: { minify?: boolean } = {}) {
  const result = await Transpiler.transpile(source, {
    terminator: "$ctx.content",
    ...options,
  });
  return result.run({
    ctx: new Context({ scope: Scope.globalScope() }),
  });
}

describe("runtime regressions", () => {
  it("supports negating async functions", async () => {
    await assert.doesNotReject(() => Transpiler.transpile("$!sendMessage[$channelID;hello;false]"));

    FunctionManager.add(
      new AntamFunction({
        name: "testAsyncNegate",
        description: "Test negating async functions",
        type: FunctionType.Getter,
        output: ArgType.String,
        async transpile(ctx) {
          return this.success(ctx, ArgType.String, 'await Promise.resolve("done")');
        },
      }),
    );

    assert.equal(await execute("$!testAsyncNegate"), "");
  });

  it("preserves fractional and unsafe integer values", () => {
    assert.equal(parseStringToData("1.5"), 1.5);
    assert.equal(parseStringToData("9007199254740992"), 9007199254740992n);
    assert.equal(parseStringToData("-42n"), -42n);
    assert.equal(parseStringToData("1e3"), 1000);
    assert.equal(parseStringToData("not a number"), "not a number");
  });

  it("accepts valid Snowflake literals and rejects other values", async () => {
    assert.equal(await execute("$testSnowflakeArg[12345678901234567]"), "12345678901234567");
    await assert.rejects(() => Transpiler.transpile("$testSnowflakeArg[not-id]"), {
      name: "TypeError",
      message: /Invalid argument "id"/,
    });
  });

  it("enables minification by default and allows explicitly disabling it", async () => {
    const defaults = await Transpiler.transpile("$add[2;3]");
    const disabled = await Transpiler.transpile("$add[2;3]", {
      minify: false,
    });

    assert.notEqual(defaults.minifiedCode, null);
    assert.equal(disabled.minifiedCode, null);
  });

  it("preserves comments alongside their corresponding argument parts", async () => {
    const result = await Transpiler.transpile(
      "$log[before $c[first]middle $c[second]after]",
    );

    const before = result.code.indexOf('"before "');
    const firstComment = result.code.indexOf("/* first */");
    const middle = result.code.indexOf('"middle "');
    const secondComment = result.code.indexOf("/* second */");
    const after = result.code.indexOf('"after"');

    assert.ok(before < firstComment);
    assert.ok(firstComment < middle);
    assert.ok(middle < secondComment);
    assert.ok(secondComment < after);

    const commentOnly = await Transpiler.transpile("$log[$c[only]]");
    assert.match(commentOnly.code, /\/\* only \*\/\s*""/);
  });

  it("uses named capture groups in minifier patches", () => {
    assert.equal(minifyCode('console.log(String("hello"));'), 'console.log("hello");');
    assert.equal(
      minifyCode('console.log(getVariable(String("result")) + "\\n```");'),
      'console.log(getVariable("result")+"\\n```");',
    );
    assert.equal(minifyCode('console.log(Number("42"));'), "console.log(42);");
    assert.equal(minifyCode('console.log(Boolean("true"));'), "console.log(!0);");
    assert.equal(minifyCode('console.log(Number("nope"));'), 'console.log(Number("nope"));');
    assert.equal(minifyCode('console.log("Number(\\"2\\")");'), "console.log('Number(\"2\")');");
    assert.equal(minifyCode('console.log(Number("1e3"));'), "console.log(1e3);");
    assert.equal(minifyCode('console.log(Number("0x10"));'), "console.log(16);");
    assert.equal(
      minifyCode('console.log(value.String("text"));'),
      'console.log(value.String("text"));',
    );
    const regexSource = 'const pattern = /[String("x")]/; pattern.test(value)';
    const minifiedRegex = minifyCode(regexSource);
    assert.equal(Function("value", `return ${minifiedRegex}`)("S"), true);
  });

  it("generates valid string literals, including empty and escaped strings", () => {
    assert.equal(Code.stringLiteral('""'), '""');
    assert.equal(Code.stringLiteral('"hello\\nworld"'), '"hello\\nworld"');
    assert.equal(Code.parenthesize("a + b"), "(a + b)");
    assert.equal(Code.propertyAccess("object", "a-b"), '(object)["a-b"]');
    assert.equal(Code.callExpression("fn", ["a", "b"]), "(fn)(a, b)");
  });

  it("validates argument types during transpilation", async () => {
    await assert.rejects(() => Transpiler.transpile("$add[not-a-number;2]"), {
      name: "TypeError",
      message: /Invalid argument "numbers"/,
    });
    const compiled = await Transpiler.transpile("$add[2;3]");
    assert.doesNotMatch(compiled.code, /validateArgument/);
    assert.equal(await execute("$add[2;3]"), "5");
  });

  it("enforces enum values from argument metadata during transpilation", async () => {
    assert.equal(await execute("$testMode[fast]"), "fast");
    await assert.rejects(() => Transpiler.transpile("$testMode[invalid]"), {
      name: "TypeError",
      message: /expected.*enum\(fast, safe\)/,
    });
  });

  it("stores, updates, and reads script variables", async () => {
    assert.equal(await execute("$let[answer;42]$get[answer]"), "42");
    assert.equal(await execute("$let[answer;first]$let[answer;second]$get[answer]"), "second");
    await assert.rejects(() => execute("$get[missing]"), {
      name: "ReferenceError",
      message: 'Variable "missing" is not defined',
    });
  });

  it("supports the additional string, math, and variable functions", async () => {
    assert.equal(await execute("$repeat[ha;3]"), "hahaha");
    assert.equal(await execute("$reverseText[abc]"), "cba");
    assert.equal(await execute("$abs[-4]"), "4");
    assert.equal(await execute("$floor[4.9]"), "4");
    assert.equal(await execute("$round[4.5]"), "5");
    assert.equal(await execute("$ceil[4.1]"), "5");
    assert.equal(await execute("$max[3;9;4]"), "9");
    assert.equal(await execute("$min[3;-2;4]"), "-2");
    assert.equal(await execute("$sign[-12]"), "-1");
    assert.match(await execute("$randomstring[24;ab]"), /^[ab]{24}$/);
    assert.equal(await execute("$escapeCode[*hi*]"), "\\*hi\\*");
    assert.equal(
      await execute(
        "$let[total;10]$letSum[total;2]$letSub[total;1]$letMulti[total;3]$letDivide[total;3]$get[total]",
      ),
      "11",
    );
    assert.equal(
      await execute("$let[value;yes]$has[value]|$delete[value]$has[value]"),
      "true|false",
    );
    assert.equal(await execute("$has[missing]"), "false");
    await assert.rejects(() => execute("$letSum[missing;1]"), {
      name: "ReferenceError",
      message: 'Variable "missing" is not defined',
    });
  });

  it("registers the Discord context and user helper functions", async () => {
    const result = await Transpiler.transpile(
      "$username|$authorID|$guildID|$guildName|$sersCount|$usersCount|$membersCount|$allMembersCount|$guildCount|$channelCount|$allChannelCount|$messageContent|$findUser[Alice]|$findmember[Alice]|$isBot|$useravatar|$userDisplayName",
    );
    assert.ok(result.parsed.fns.has("findUser"));
    assert.ok(result.parsed.fns.has("findMember"));
    assert.ok(result.parsed.fns.has("userDisplayName"));
    assert.ok(result.parsed.fns.has("usersCount"));
  });

  it("finds users and guild members by ID, mention, and username", async () => {
    const user = {
      id: "12345678901234567",
      username: "Alice",
      globalName: "Alice Example",
      tag: "Alice#0001",
      bot: false,
    } as unknown as DiscordJS.User;
    const member = {
      id: user.id,
      user,
      displayName: "Alice Example",
    } as unknown as DiscordJS.GuildMember;
    const users = new DiscordJS.Collection<string, DiscordJS.User>([[user.id, user]]);
    const members = new DiscordJS.Collection<string, DiscordJS.GuildMember>([[member.id, member]]);
    const client = {
      users: { cache: users },
    } as unknown as AntamClient;
    const guild = {
      members: { cache: members },
    } as unknown as DiscordJS.Guild;

    assert.equal(ImportedDiscordFunctions.findUserByQuery(client, "@alice"), user);
    assert.equal(ImportedDiscordFunctions.findUserByQuery(client, `<@${user.id}>`), user);
    assert.equal(ImportedDiscordFunctions.findUserByQuery(client, user.id), user);
    assert.equal(ImportedDiscordFunctions.findMemberByQuery(guild, "@alice"), member);
    assert.equal(ImportedDiscordFunctions.findMemberByQuery(guild, `<@!${user.id}>`), member);

    const result = await Transpiler.transpile(
      "$isBot[$findUser[@alice]]|$userDisplayName[$findMember[Alice]]",
      { terminator: "$ctx.content" },
    );
    const output = await result.run({
      ctx: new Context({ scope: Scope.globalScope() }),
      client,
      discord: {
        message: { author: user, content: "" } as unknown as DiscordJS.Message,
        user,
        guild,
        channel: null,
        args: [],
      },
    });
    assert.equal(output, "false|Alice Example");
  });

  it("executes all statements in the selected if branch and appends their output", async () => {
    assert.equal(await execute("$let[p;20202]$if[true;bot ping $get[p]ms]"), "bot ping 20202ms");
    assert.equal(await execute("$if[false;wrong;$let[p;15]$get[p]]"), "15");
  });

  it("returns the selected value from the non-scope ternary function", async () => {
    assert.equal(await execute("$ternary[true;yes;no]"), "yes");
    assert.equal(await execute("$ternary[false;$add[2;3];no]"), "no");
    assert.equal(await execute("$ternary[true;$add[2;3];no]"), "5");
  });

  it("sums nested numeric functions", async () => {
    const result = await Transpiler.transpile("$sum[0;$ping;39]", {
      terminator: "$ctx.content",
    });
    const value = await result.run({
      ctx: new Context({ scope: Scope.globalScope() }),
      client: { ws: { ping: 42 } } as import("../src").AntamClient,
    });

    assert.equal(value, "81");
  });

  it("prevents reassignment of constant script variables", async () => {
    await assert.rejects(() => execute("$let[answer;42;true]$let[answer;43]"), {
      name: "TypeError",
      message: 'Cannot reassign constant "answer"',
    });
  });

  it("supports random text, runtime types, and the text length names", async () => {
    assert.equal(await execute("$randomText[only choice]"), "only choice");
    assert.equal(await execute("$typeof[$add[2;3]]"), "number");
    assert.equal(await execute("$charCount[hello]"), "5");
    assert.equal(await execute("$textLength[hello]"), "5");
    await assert.rejects(() => Transpiler.transpile("$length[hello]"), {
      name: "Error",
      message: /Unknown function/,
    });
  });

  it("checks nested function outputs against the argument allow list", async () => {
    assert.equal(await execute("$add[$textLength[abc];2]"), "5");
    await assert.rejects(() => Transpiler.transpile("$add[$lower[abc];2]"), {
      name: "TypeError",
      message: /Invalid argument "numbers".*received String/,
    });
    await assert.rejects(
      () => Transpiler.transpile("$add[$if[true;$log[not a value]];2]"),
      /Scope function "if" cannot be used as an argument value/,
    );
  });

  it("normalizes typed boolean arguments before function execution", async () => {
    const result = Number(await execute("$random[1;2;false]"));
    assert.ok(Number.isInteger(result));
    assert.ok(result >= 1 && result <= 2);
  });

  it("floors negative random values without truncating them toward zero", async () => {
    const originalRandom = Math.random;
    Math.random = () => 0.1;
    try {
      assert.equal(await execute("$random[-10;-2]"), "-10");
    } finally {
      Math.random = originalRandom;
    }
  });

  it("passes raw argument source as a string without transpiling it", async () => {
    assert.equal(await execute("$testRaw[$lower[RAW]]"), "$lower[RAW]");
  });

  it("parses condition arguments and emits typed comparisons", async () => {
    assert.equal(await execute("$testCondition[1 == true]"), "true");
    assert.equal(await execute("$testCondition[0]"), "false");
    assert.equal(await execute("$testCondition[$textLength[abc] == 3]"), "true");
  });

  it("reports elapsed time since the runtime context was created", async () => {
    const result = await Transpiler.transpile("$executionTime", {
      terminator: "$ctx.content",
    });
    const ctx = new Context({ scope: Scope.globalScope() });
    await new Promise((resolve) => setTimeout(resolve, 5));

    const elapsed = Number(await result.run({ ctx }));
    assert.ok(Number.isFinite(elapsed));
    assert.ok(elapsed >= 5);
  });

  it("suppresses runtime argument errors for the silent operator", async () => {
    assert.equal(await execute("$#add[not-a-number;2]"), "");
  });
});
