import { getDiscordImportedFunctions } from "../../../../discordjs/imported";
import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "sendMessage",
  aliases: ["channelSendMessage"],
  description: "Sends a message to a channel",
  type: FunctionType.Getter,
  output: [ArgType.Message, "void"],
  brackets: true,
  args: [
    {
      name: "channel",
      description: "The channel to send this message to",
      required: true,
      type: ArgType.Channel,
      rest: false,
      save: true,
      allow: [ArgType.Channel, ArgType.Snowflake],
    },
    {
      name: "content",
      description: "The content for the message",
      type: ArgType.String,
      rest: false,
      save: false,
      allow: AllowedArgTypePreset.String,
    },
    {
      name: "return message",
      description: "Whether to return the newly sent message",
      rest: false,
      type: ArgType.Boolean,
      allow: AllowedArgTypePreset.Boolean,
      save: false,
    },
  ],
  importFunctions: [
    ...getDiscordImportedFunctions("findChannel", "sendMessage"),
    "predicateChannelByIDOrObj",
  ],
  async transpile(ctx, [chnlID, content, returnMessage]) {
    const code = `await f$sendMessage(${Code.reservedNames.context}, f$findChannel(${Code.reservedNames.client}, channel => f$predicateChannelByIDOrObj(channel, ${chnlID.variable}||null)), ${content.code}, ${returnMessage.code})`;
    return this.success(ctx, [ArgType.Message, "void"], code);
  },
});
