import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import {
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "guildMembersCount",
  description: "Returns the guild's member count",
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
  importFunctions: [
    ...getDiscordImportedFunctions("findGuild"),
    "predicateGuildByIDOrObj",
  ],
  transpile(ctx, [guild]) {
    return this.success(
      ctx,
      ArgType.Snowflake,
      `(f$findGuild(${Code.reservedNames.client}, guild => f$predicateGuildByIDOrObj(${guild.code} || ${Code.reservedNames.discord}.guild))?.members.cache.size ?? 0)`,
    );
  },
});
