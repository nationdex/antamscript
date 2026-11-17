import { AntamFunction, ArgType, AllowedArgTypePreset, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "trim",
  description: "Removes leading and trailing whitespace from a string",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "string",
      description: "The string to trim",
      rest: true,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
  ],

  transpile(ctx, [values]) {
    let code = `${this.code.joinArguments(values.code)}.trim()`;
    return this.success(ctx, ArgType.String, code);
  },
});
