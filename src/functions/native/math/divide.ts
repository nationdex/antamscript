import { AntamFunction, ArgType, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "divide",
  description: "Divides the first number by the subsequent numbers",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "numbers",
      description: "The numbers to divide",
      rest: true,
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
      save: false,
    },
  ],

  transpile(ctx) {
    const args = this.resolveArgsFrom(0);
    const code = args.length ? args.map((arg) => arg.code).join(" / ") : "0";
    return this.success(ctx, ArgType.Number, `(${code})`);
  },
});
