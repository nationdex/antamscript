import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "toString",
  description: "Converts a value to a string",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "value",
      description: "The value to convert to string",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [value]) {
    return this.success(ctx, ArgType.String, `String(${value.code})`);
  },
});
