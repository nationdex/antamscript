import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "delete",
  description: "Deletes a variable",
  type: FunctionType.Declaration,
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
      raw: true,
    },
  ],

  transpile(ctx, [name]) {
    const varName = this.code.unwrapString(name.code);
    const id = ctx.scope.getVariableID(varName);
    if (id === undefined) {
      return this.error(ctx, `Variable "${varName}" is not defined`);
    }
    const code = `${this.code.escapeVariableName(id)} = undefined;`;
    ctx.scope.deleteVariable(varName);
    return this.success(ctx, "void", code);
  },
});
