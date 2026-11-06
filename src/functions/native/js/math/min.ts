import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "min",
  description: "Returns the smallest of the provided numbers",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "numbers",
      description: "The numbers to compare",
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
      rest: true,
      save: false,
    },
  ],
  transpile(ctx) {
    const args = this.resolveArgsFrom(0);
    return this.success(
      ctx,
      ArgType.Number,
      `Math.min(${args.map((arg) => arg.code).join(", ")})`,
    );
  },
});
