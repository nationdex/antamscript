import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "botCount",
  description: "Returns the bot count of the bot",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(
      ctx,
      ArgType.Number,
      `${this.code.reserved("client")}.users.cache.filter((u) => u.bot).size`,
    );
  },
});
