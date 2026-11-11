import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "jsonAssign",
  aliases: ["jsonCombine"],
  description: "Combines multiple JSON objects into a single JSON object",
  type: FunctionType.Setter,
  output: [ArgType.Json, "void"],
  brackets: true,
  args: [
    {
      name: "variable",
      description: "The variable that holds the target object",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
      rest: false,
    },
    {
      name: "other variable",
      description: "The variable to load the result to",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
      rest: false,
    },
    {
      name: "objects",
      description: "The objects from which to copy properties",
      type: ArgType.Json,
      required: true,
      rest: true,
      save: false,
    },
  ],

  importFunctions: [["jsonAssign", (json: object, objs: object[]) => Object.assign(json, ...objs)]],
  transpile(ctx, [variable, other, objects]) {
    const code = `${Code.reservedNames.context}.scope.setEnvironment(${other.code}, f$jsonAssign(${Code.reservedNames.context}.scope.getEnvironment(${variable.code}) || {}, ${objects.code}))`;
    return this.success(ctx, "void", code);
  },
});
