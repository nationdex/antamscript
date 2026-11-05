import { AntamFunction, ArgType, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "ceil",
  description: "Rounds a number up to the nearest integer",
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
    return this.success(ctx, ArgType.Number, `Math.ceil(${value.code})`);
  },
});
