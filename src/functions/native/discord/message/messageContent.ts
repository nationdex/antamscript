import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import {
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "messageContent",
  description: "Returns the original message content",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: false,
  args: [
    {
      name: "channel ID",
      rest: false,
      required: true,
      description: "The channel to get the message from",
      type: ArgType.Channel,
      allow: [ArgType.Channel, ArgType.Snowflake],
      save: false,
    },
    {
      name: "message ID",
      description: "The message to get its content",
      rest: false,
      type: ArgType.Message,
      required: true,
      allow: [ArgType.Message, ArgType.Snowflake],
      save: false,
    },
  ],
  importFunctions: [
    ...getDiscordImportedFunctions("findMessageByID", "findChannel"),
    "predicateChannelByIDOrObj",
  ],
  transpile(ctx, [chnl, msg]) {
    return this.success(
      ctx,
      ArgType.String,
      `(f$findMessageByID(${Code.reservedNames.client}, f$findChannel(${Code.reservedNames.client}, channel => f$predicateChannelByIDOrObj(channel, ${chnl.code} || ${Code.reservedNames.discord}.channel)), ${msg.code})?.content ?? null)`,
    );
  },
});
