import { AntamFunction, ArgType, Code, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "ping",
  description: "Returns the bot's WebSocket heartbeat latency in milliseconds",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(ctx, ArgType.Number, `${Code.reservedNames.client}.ws.ping`);
  },
});
