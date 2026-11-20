import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "get",
  description: "Gets the value of a variable",
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
      raw: true,
    },
  ],

  transpile(ctx, [name]) {
    const varName = this.code.unwrapString(name.code);
    const id = ctx.scope.getVariableID(varName);
    if (id === undefined) {
      return this.error(ctx, `Variable "${varName}" is not defined`);
    }
    const code = this.code.escapeVariableName(id);
    return this.success(ctx, ArgType.Unknown, code);
  },
});
