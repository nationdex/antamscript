import { AntamFunction, ArgType, Code, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "authorID",
  aliases: ["userID"],
  description: "Returns the message author's ID",
  type: FunctionType.Getter,
  output: ArgType.Snowflake,
  transpile(ctx) {
    return this.success(ctx, ArgType.Snowflake, `${Code.reservedNames.discord}.message.author.id`);
  },
});
