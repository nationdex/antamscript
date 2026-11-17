import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "uptime",
  aliases: ["botUptime", "clientUptime"],
  description: "Returns the bots uptime",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(ctx, ArgType.Number, `${this.code.reserved("client")}.uptime`);
  },
});
