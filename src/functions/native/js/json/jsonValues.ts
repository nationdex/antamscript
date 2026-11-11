import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
  Scope,
} from "../../../../structure";

export default new AntamFunction({
  name: "jsonValues",
  description: "Gets values from a JSON variable",
  type: FunctionType.Getter,
  output: ArgType.Json,
  brackets: true,
  args: [
    {
      name: "variable",
      description: "The variable to get values from",
      type: ArgType.String,
      required: true,
      rest: false,
      save: false,
    },
  ],

  transpile(ctx, [variable]) {
    const code = `(Object.values(${Code.reservedNames.context}.scope.getEnvironment(${variable.code})) || [])`;
    return this.successJSON(
      ctx,
      {
        json: code,
      },
      ArgType.Json,
    );
  },
});
