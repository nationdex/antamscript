import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "get",
  description: "Gets a script variable",
  type: FunctionType.Getter,
  output: ArgType.Unknown,
  brackets: true,
  args: [
    {
      name: "name",
      description: "The variable name",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
    },
  ],

  transpile(ctx, [name]) {
    const code = `${Code.reservedNames.context}.scope.getVariable(${name.code})`;
    return this.success(ctx, ArgType.Unknown, code);
  },
});
