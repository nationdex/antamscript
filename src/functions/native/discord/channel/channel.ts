import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "channel",
  description: "Returns the channel's obj",
  type: FunctionType.Getter,
  output: ArgType.Channel,
  brackets: false,
  args: [
    {
      name: "channel ID",
      description: "The channel ID to get the channel",
      rest: false,
      type: ArgType.Snowflake,
      allow: AllowedArgTypePreset.Snowflake,
      required: true,
      save: false,
    },
  ],
  importFunctions: getDiscordImportedFunctions("findChannelByID"),
  transpile(ctx, [chnl]) {
    return this.success(
      ctx,
      ArgType.Channel,
      `(f$findChannelByID(${this.code.reserved("client")}, ${chnl.code} || ${this.code.reserved("discord")}.channel) ?? null)`,
    );
  },
});
