import { AntamFunction, ArgType, Code, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "messageID",
  description: "Returns the Discord message's id",
  type: FunctionType.Getter,
  output: ArgType.Snowflake,
  transpile(ctx) {
    return this.success(ctx, ArgType.Snowflake, `${Code.reservedNames.discord}.message.id`);
  },
});
