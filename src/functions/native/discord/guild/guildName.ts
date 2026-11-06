import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import {
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";
export default new AntamFunction({
  name: "guildName",
  description: "Returns the guild name, or an empty string in direct messages",
  type: FunctionType.Getter,
  output: ArgType.String,
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
  importFunctions: [
    ...getDiscordImportedFunctions("findGuild"),
    "predicateGuildByIDOrObj",
  ],
  transpile(ctx, [guild]) {
    return this.success(
      ctx,
      ArgType.Snowflake,
      `(f$findGuild(${Code.reservedNames.client}, guild => f$predicateGuildByIDOrObj(${guild.code} || ${Code.reservedNames.discord}.guild))?.name ?? null )`,
    );
  },
});
