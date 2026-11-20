import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "has",
  aliases: ["hasVariable"],
  description: "Returns whether a script variable exists",
  type: FunctionType.Getter,
  output: ArgType.Boolean,
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
      return this.success(ctx, ArgType.Boolean, `false`);
    }
    const code = this.code.escapeVariableName(id);
    return this.success(ctx, ArgType.Boolean, `typeof ${code} !== 'undefined'`);
  },
});
