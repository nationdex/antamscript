import { getDiscordImportedFunctions } from "../../../discordjs/imported";
import { AntamFunction, ArgType, Code, FunctionType } from "../../../structure";
export default new AntamFunction({
  name: "channelName",
  description: "Returns the channel name",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: false,
  args: [
    {
      name: "channel",
      description: "The channel ID",
      rest: false,
      type: ArgType.Channel,
      allow: [ArgType.Channel, ArgType.Snowflake],
      required: true,
      save: false,
    },
  ],
  importFunctions: getDiscordImportedFunctions("findChannel"),
  transpile(ctx, [chnl]) {
    const predicateCode = `{
      let chnl = ${chnl.code} || ${Code.reservedNames.discord}.chnl;
        return !chnl ? null : ((typeof chnl == "string" ? chnl : chnl.id) == channel.id);
      }`;
    return this.success(
      ctx,
      ArgType.Snowflake,
      `(f$findChannel(${Code.reservedNames.client}, channel => ${predicateCode})?.name ?? null)`,
    );
  },
});
