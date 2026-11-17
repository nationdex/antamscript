import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "jsonKeys",
  description: "Gets keys from a JSON variable",
  type: FunctionType.Getter,
  output: ArgType.Json,
  brackets: true,
  args: [
    {
      name: "variable",
      description: "The variable to get keys from",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
    },
  ],

  transpile(ctx, [variable]) {
    const code = `(Object.keys(${this.code.getEnvironment(variable.code)}) || [])`;
    return this.successJSON(
      ctx,
      {
        json: code,
      },
      ArgType.Json,
    );
  },
});
