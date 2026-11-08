import { AntamFunction, ArgType, Code, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "allChannelCount",
  aliases: ["channelCount"],
  description: "Returns the number of channels in the client's cache",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(ctx, ArgType.Number, `${Code.reservedNames.client}.channels.cache.size`);
  },
});
