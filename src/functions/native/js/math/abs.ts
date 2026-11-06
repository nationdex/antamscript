import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "abs",
  description: "Returns the absolute value of a number",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "number",
      description: "The number to process",
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [value]) {
    return this.success(ctx, ArgType.Number, `Math.abs(${value.code})`);
  },
});
