import {
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "bot",
  aliases: ["client"],
  description: "Returns the client instance",
  type: FunctionType.Getter,
  output: ArgType.User,
  transpile(ctx) {
    return this.success(ctx, ArgType.User, `${Code.reservedNames.client}.user`);
  },
});
