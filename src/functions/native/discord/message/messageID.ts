import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "messageID",
  description: "Returns the message's id",
  type: FunctionType.Getter,
  output: ArgType.Snowflake,
  transpile(ctx) {
    return this.success(ctx, ArgType.Snowflake, `${this.code.reserved("discord")}.message.id`);
  },
});
