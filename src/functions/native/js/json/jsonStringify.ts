import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "jsonStringify",
  description: "Returns the JSON in stringified format",
  type: FunctionType.Setter,
  output: ArgType.Json,
  brackets: true,
  args: [
    {
      name: "variable",
      description: "The variable which has json",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "space",
      description: "The space to use",
      type: ArgType.Number,
      rest: false,
      required: false,
      save: false,
    },
  ],

  transpile(ctx, [variable, spaces]) {
    return this.successJSON(
      ctx,
      {
        space: spaces.code == "undefined" ? undefined : (spaces.code as any),
        json: `${Code.reservedNames.context}.scope.getEnvironment(${variable.code})`,
      },
      ArgType.Json,
    );
  },
});
