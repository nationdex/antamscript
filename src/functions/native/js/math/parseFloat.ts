import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "parseFloat",
  description: "Parses a string or value as a floating point number",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "value",
      description: "The value to parse as a float",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [value]) {
    return this.success(ctx, ArgType.Number, `parseFloat(${value.code})`);
  },
});
