import {
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "botID",
  aliases: ["clientID"],
  description: "Returns the client's id",
  type: FunctionType.Getter,
  output: ArgType.Snowflake,
  transpile(ctx) {
    return this.success(
      ctx,
      ArgType.Snowflake,
      `${Code.reservedNames.client}.user.id`,
    );
  },
});
