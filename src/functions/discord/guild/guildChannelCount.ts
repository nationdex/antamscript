import { getDiscordImportedFunctions } from "../../../discordjs/imported";
import { AntamFunction, ArgType, Code, FunctionType } from "../../../structure";

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
  importFunctions: getDiscordImportedFunctions("findGuild"),
  transpile(ctx, [guild]) {
    const predicateCode = `{
    let g = ${guild.code} || ${Code.reservedNames.discord}.guild;
      return !g ? null : ((typeof g == "string" ? g : g.id) == guild.id);
    }`;
    return this.success(
      ctx,
      ArgType.Snowflake,
      `(f$findGuild(${Code.reservedNames.client}, guild => ${predicateCode})?.channels.cache.size ?? 0)`,
    );
  },
});
