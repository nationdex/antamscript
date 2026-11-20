import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "letSub",
  aliases: ["varSub"],
  description: "Subtracts an amount from an existing variable",
  type: FunctionType.Declaration,
  output: "void",
  brackets: true,
  args: [
    {
      name: "variable",
      description: "The existing variable to update",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
      raw: true,
    },
    {
      name: "amount",
      description: "The number to apply",
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [variable, amount]) {
    const varName = this.code.unwrapString(variable.code);
    const id = ctx.scope.getVariableID(varName);
    if (id === undefined) {
      return this.error(ctx, `Variable "${varName}" is not defined`);
    }
    const code = this.code.escapeVariableName(id);
    return this.success(ctx, "void", `${code} -= Number(${amount.code})`);
  },
});
