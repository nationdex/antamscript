import { getDiscordImportedFunctions } from "../../../discordjs/imported";
import { AntamFunction, ArgType, Code, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "guildID",
  description: "Returns the guild ID, or an empty string in direct messages",
  type: FunctionType.Getter,
  output: ArgType.Snowflake,
  brackets: false,
  args: [
    {
      name: "name",
      description: "The guild name to get id",
      rest: false,
      type: ArgType.Guild,
      allow: [ArgType.Guild, ArgType.Snowflake],
      required: true,
      save: false,
    },
  ],
  importFunctions: [
    ...getDiscordImportedFunctions("findGuild"),
    "predicateGuildByNameOrObj",
  ],
  transpile(ctx, [name]) {
    return this.success(
      ctx,
      ArgType.Snowflake,
      `(f$findGuild(${Code.reservedNames.client}, guild => f$predicateGuildByNameOrObj(${name.code} || ${Code.reservedNames.discord}.guild))?.id ?? null)`,
    );
  },
});
