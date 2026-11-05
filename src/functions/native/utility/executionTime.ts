import { AntamFunction, ArgType, Code, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "executionTime",
  description: "Returns elapsed time in milliseconds since the context started",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(
      ctx,
      ArgType.Number,
      Code.binaryExpression("performance.now()", "-", `${Code.reservedNames.context}.startTime`),
    );
  },
});
