import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "bot",
  aliases: ["client"],
  description: "Returns the client user instance",
  type: FunctionType.Getter,
  output: ArgType.User,
  transpile(ctx) {
    return this.success(ctx, ArgType.User, `${this.code.reserved("client")}.user`);
  },
});
