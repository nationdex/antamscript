import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import * as DiscordJS from "discord.js";
import {
  AntamClient,
  Context,
  FileReader,
  FunctionManager,
  Scope,
} from "../src/index";
import { Transpiler } from "../src/core/Transpiler";

describe("AntamClient", () => {
  it("creates a bot instance and registers the requested native event listener", async () => {
    const client = new AntamClient({
      events: ["clientReady", "messageCreate"],
      intents: ["Guilds", "GuildMessages"],
      prefixes: ["$add[5;10]"],
    });
    assert.equal(client.events.has("AntamScriptNative", "clientReady"), true);
    assert.equal(client.events.has("AntamScriptNative", "messageCreate"), true);
    assert.equal(client.listenerCount("clientReady"), 1);
    assert.equal(client.listenerCount("messageCreate"), 1);
    assert.equal(client.commands.count, 0);

    let updated = false;
    client.commands.on("update", () => {
      updated = true;
    });
    const updatedCommand = new Promise<void>((resolve) => {
      client.commands.once("update", resolve);
    });
    client.commands.add({
      type: "clientReady",
      name: "test-command",
      code: "$log[ready]",
    });
    await updatedCommand;

    assert.equal(updated, true);
    assert.equal(client.commands.count, 1);
    assert.equal(client.commands.get("clientReady")[0]?.name, "test-command");
    client.destroy();
  });

  it("waits for prefix initialization before matching messages", async () => {
    const client = new AntamClient({
      intents: ["Guilds"],
      prefixes: ["$add[2;3]"],
    });
    const message = {
      content: "5 ping",
      author: {},
      guild: null,
      channel: { isDMBased: () => true },
    } as import("discord.js").Message;

    assert.equal(await client.getPrefix(message), "5");
    client.destroy();
  });

  it("shares the client and command with transpiled code and trims top-level content", async () => {
    FunctionManager.loadNative();
    const client = {
      ws: { ping: 20202 },
    } as AntamClient;
    const command = null;
    const result = await Transpiler.transpile("\n$ping", {
      terminator: "$ctx.content",
    });

    assert.equal(
      await result.run({
        ctx: new Context({ scope: Scope.globalScope() }),
        client,
        command,
      }),
      "20202",
    );

    const nested = await Transpiler.transpile("$add[$ping;2]", {
      terminator: "$ctx.content",
    });
    assert.equal(
      await nested.run({
        ctx: new Context({ scope: Scope.globalScope() }),
        client,
        command: null,
      }),
      "20204",
    );
  });

  it("returns bot IDs as Snowflake values", async () => {
    FunctionManager.loadNative();
    const result = await Transpiler.transpile("$botID", {
      terminator: "$ctx.content",
    });

    assert.equal(
      await result.run({
        ctx: new Context({ scope: Scope.globalScope() }),
        client: { user: { id: "12345678901234567" } } as AntamClient,
      }),
      "12345678901234567",
    );
  });

  it("returns all message arguments or a zero-based indexed argument", async () => {
    FunctionManager.loadNative();
    const result = await Transpiler.transpile("$message|$message[1]", {
      terminator: "$ctx.content",
    });

    assert.equal(
      await result.run({
        ctx: new Context({ scope: Scope.globalScope() }),
        discord: {
          args: ["hello", "world"],
        },
      }),
      "hello world|world",
    );
  });

  it("evaluates runtime AntamScript strings through Transpiler data", async () => {
    FunctionManager.loadNative();
    const result = await Transpiler.transpile("$eval[$get[script]]", {
      terminator: "$ctx.content",
    });
    const ctx = new Context({ scope: Scope.globalScope() });
    ctx.scope.setVariable("script", "$add[2;3]");

    assert.equal(
      await result.run({
        ctx,
      }),
      "5",
    );
  });

  it("evaluates JavaScript strings with $jsEval", async () => {
    FunctionManager.loadNative();
    const result = await Transpiler.transpile("$jsEval[1 + 2]", {
      terminator: "$ctx.content",
    });

    assert.equal(
      await result.run({
        ctx: new Context({ scope: Scope.globalScope() }),
      }),
      "3",
    );
  });

  it("binds the runtime data as this in $jsEval", async () => {
    FunctionManager.loadNative();
    const result = await Transpiler.transpile(
      '$jsEval[this.ctx ? "bound" : "missing"]',
      { terminator: "$ctx.content" },
    );

    assert.equal(
      await result.run({
        ctx: new Context({ scope: Scope.globalScope() }),
      }),
      "bound",
    );
  });

  it("reads .ass event blocks, arbitrary properties, and multiline code", () => {
    const directory = mkdtempSync(join(tmpdir(), "antamscript-"));
    const file = join(directory, "ping.ass");
    try {
      writeFileSync(
        file,
        `@messageCreate{
name: ping
aliases: ["p", "pong"]
allowBots: false
code: $log[ping]
$log[still ping]
}`,
      );

      const cmds = FileReader.read(file);
      assert.deepEqual(cmds, [
        {
          type: "messageCreate",
          name: "ping",
          aliases: ["p", "pong"],
          allowBots: false,
          code: "$log[ping]\n$log[still ping]",
        },
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
