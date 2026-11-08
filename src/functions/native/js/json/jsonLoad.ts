import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "jsonLoad",
  aliases: ["loadJSON"],
  description: "Loads JSON to an env variable",
  type: FunctionType.Setter,
  output: "void",
  brackets: true,
  args: [
    {
      name: "variable",
      description: "The variable to load json to",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "json",
      description: "The value to store",
      type: ArgType.Json,
      required: true,
      rest: false,
      save: false,
    },
  ],

  transpile(ctx, [variable, json]) {
    const code = `${Code.reservedNames.context}.scope.setEnvironment(${variable.code}, ${json.code})`;
    return this.success(ctx, "void", code);
  },
});
