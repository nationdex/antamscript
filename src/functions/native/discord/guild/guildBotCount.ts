import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import { AntamFunction, ArgType, Code, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "guildBotCount",
  description: "Returns the bot count in a guild",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: false,
  args: [
    {
      name: "guild",
      description: "The guild ID",
      rest: false,
      type: ArgType.Guild,
      allow: [ArgType.Guild, ArgType.Snowflake],
      required: true,
      save: false,
    },
  ],
  importFunctions: [...getDiscordImportedFunctions("findGuild"), "predicateGuildByIDOrObj"],
  transpile(ctx, [guild]) {
    return this.success(
      ctx,
      ArgType.Number,
      `(f$findGuild(${Code.reservedNames.client}, guild => f$predicateGuildByIDOrObj(${guild.code} || ${Code.reservedNames.discord}.guild))?.members.cache.filter((u) => u.bot).size ?? 0)`,
    );
  },
});
