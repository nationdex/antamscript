import { EmbedBuilder } from "discord.js";
import { DiscordEventHandler } from "../../discordjs/DiscordEventHandler";
import { Context, Scope } from "../../structure";

export default new DiscordEventHandler({
  name: "messageCreate",
  description: "Matches configured prefixes and executes matching message commands",
  intents: ["GuildMessages", "MessageContent"],

  listener: async function (message) {
    const prefix = await this.getPrefix(message);

    const args = message.content
      .trim()
      .slice(prefix?.length ?? 0)
      .trim()
      .split(/ +/g);
    const rawName = prefix ? args.shift() : args[0];

    const commands = this.commands.get("messageCreate").filter((cmd) => {
      const allowBots = cmd.data.allowBots ?? this.options.allowBots ?? false;
      if (message.author.bot && !allowBots) return false;

      const ignoreCase = cmd.data.nameCaseInsensitive !== false;
      const name = ignoreCase ? rawName?.toLowerCase() : rawName;
      const cmdName = ignoreCase ? cmd.name?.toLowerCase() : cmd.name;
      const aliases = ignoreCase ? cmd.data.aliases?.map((x) => x.toLowerCase()) : cmd.data.aliases;

      // Allow always execute commands
      return (
        !cmd.name ||
        // Check if it matches the command name or one of aliases
        ((cmdName === name || !!aliases?.includes(name!)) && !!prefix)
      );
    });

    for (const command of commands) {
      const ctx = new Context({
        scope: Scope.globalScope(),
      });
      const transpiled = command.transpiled;
      if (!transpiled) {
        console.error(`Command ${command.name} has not been transpiled. Skipping execution.`);
        continue;
      }
      try {
        let result = (await transpiled.run({
          ctx: ctx,
          client: this,
          command: command,
          discord: {
            message,
            user: message.author,
            guild: message.guild || undefined,
            channel: message.channel,
            args: args,
          },
        })) as Context;
        if (result.content && result.content.length > 0) {
          await message.channel.send(result.content);
        }
      } catch (err: any) {
        if (message.channel.isSendable()) {
          message.channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xf4889a)
                  .setDescription(err.message ?? `Something went wrong.`)
                  .setTitle(`An error occurred while executing command "${command.name}"`),
              ],
            })
            .catch(() => {});
        }
        console.error(err);
      }
    }
  },
});
