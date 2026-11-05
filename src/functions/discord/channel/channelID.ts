import { getDiscordImportedFunctions } from "../../../discordjs/imported";
import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../structure";

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
  importFunctions: getDiscordImportedFunctions("findChannel"),
  transpile(ctx, [name]) {
    const predicateCode = `{
    let chnl = ${name.code} || ${Code.reservedNames.discord}.channel;
      return !chnl ? null : typeof chnl == "string" ? chnl == channel.name : chnl.id == channel.id;
    }`;
    return this.success(
      ctx,
      ArgType.Snowflake,
      `(f$findChannel(${Code.reservedNames.client}, channel => ${predicateCode})?.id ?? null)`,
    );
  },
});
