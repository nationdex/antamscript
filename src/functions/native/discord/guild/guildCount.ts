import { AntamFunction, ArgType, Code, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "guildCount",
  description: "Returns the number of guilds in the client's cache",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(ctx, ArgType.Number, `${Code.reservedNames.client}.guilds.cache.size`);
  },
});
