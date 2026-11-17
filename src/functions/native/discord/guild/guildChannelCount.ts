import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "guildChannelCount",
  description: "Returns the number of channels in the guild's cache",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: false,
  args: [
    {
      name: "guild ID",
      description: "The guild id to get channel count of",
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
      ArgType.Snowflake,
      `(f$findGuild(${this.code.reserved("client")}, guild => f$predicateGuildByIDOrObj(${guild.code} || ${this.code.reserved("discord")}.guild))?.channels.cache.size ?? 0)`,
    );
  },
});
