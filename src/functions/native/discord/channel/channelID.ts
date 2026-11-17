import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "channelID",
  description: "Returns the channel's id",
  type: FunctionType.Getter,
  output: ArgType.Snowflake,
  brackets: false,
  args: [
    {
      name: "name",
      description: "The channel name to get the channel",
      rest: false,
      type: ArgType.Channel,
      allow: [ArgType.Channel, ArgType.String],
      required: true,
      save: false,
    },
  ],
  importFunctions: [...getDiscordImportedFunctions("findChannel"), "predicateChannelByNameOrObj"],
  transpile(ctx, [name]) {
    return this.success(
      ctx,
      ArgType.Snowflake,
      `(f$findChannel(${this.code.reserved("client")}, channel => f$predicateChannelByNameOrObj(channel, ${name.code} || ${this.code.reserved("discord")}.channel))?.id ?? null)`,
    );
  },
});
