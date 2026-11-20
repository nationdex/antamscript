import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "parseInt",
  description: "Parses a string or value as an integer with optional radix",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "value",
      description: "The value to parse as an integer",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "radix",
      description: "An integer between 2 and 36 that represents the radix",
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: false,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [value, radix]) {
    const code = `parseInt(${value.code}, ${radix.code} || 10)`;
    return this.success(ctx, ArgType.Number, code);
  },
});
