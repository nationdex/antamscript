import { AntamFunction, ArgType, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "sub",
  description: "Subtracts numbers from the first number",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "numbers",
      description: "The numbers to subtract (first is the base)",
      rest: true,
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
      save: false,
    },
  ],

  transpile(ctx) {
    const args = this.resolveArgsFrom(0);
    const code = args.length ? args.map((arg) => arg.code).join(" - ") : "0";
    return this.success(ctx, ArgType.Number, `(${code})`);
  },
});
