import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "parseNumber",
  aliases: ["toNumber"],
  description: "Converts a value to a number",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "value",
      description: "The value to convert to number",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [value]) {
    return this.success(ctx, ArgType.Number, `Number(${value.code})`);
  },
});
