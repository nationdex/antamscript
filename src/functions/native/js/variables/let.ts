import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "let",
  description: "Creates or updates a variable",
  type: FunctionType.Declaration,
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
      raw: true,
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
  ],

  transpile(ctx, [name, value]) {
    const varName = this.code.unwrapString(name.code);
    const existingType = ctx.scope.getVariableType(varName);

    if (existingType === "var") {
      return this.error(ctx, `Cannot redeclare variable "${varName}" with let`);
    }

    const alreadyDeclared = ctx.scope.getVariableID(varName, "let");
    const id = alreadyDeclared ?? ctx.scope.registerVariable(varName, "let");
    const code = this.code.declare(id, value?.code, alreadyDeclared === undefined ? "let" : null);
    return this.success(ctx, ArgType.Unknown, code);
  },
});
