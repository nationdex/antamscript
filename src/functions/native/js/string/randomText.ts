import { AntamFunction, ArgType, AllowedArgTypePreset, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "randomText",
  description: "Returns one random value from the provided text choices",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "choices",
      description: "The text values to choose from",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: true,
      save: false,
    },
  ],

  importFunctions: ["pickFromArray"],
  transpile(ctx, [choices]) {
    const code = `f$pickFromArray(${choices.code})`;
    return this.success(ctx, ArgType.String, code);
  },
});
