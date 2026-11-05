import { AntamFunction, ArgType, Code, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "messageContent",
  description: "Returns the original message content",
  type: FunctionType.Getter,
  output: ArgType.String,
  transpile(ctx) {
    return this.success(ctx, ArgType.String, `${Code.reservedNames.discord}.message.content`);
  },
});
