import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "let",
  description: "Creates or updates a script variable",
  type: FunctionType.Setter,
  output: "void",
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
    {
      name: "value",
      description: "The value to store",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "constant",
      description: "Whether the variable is constant (cannot be changed later)",
      type: ArgType.Boolean,
      allow: AllowedArgTypePreset.Boolean,
      required: false,
      rest: false,
      save: false,
    },
  ],

  transpile(ctx, [name, value, constant]) {
    const code = `${Code.reservedNames.context}.scope.setVariable(${name.code}, ${value.code}, Boolean(${constant.code} ?? false))`;
    return this.success(ctx, "void", code);
  },
});
