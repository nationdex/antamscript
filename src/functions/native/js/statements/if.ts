import {
  AntamFunction,
  ArgType,
  AllowedArgTypePreset,
  Context,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "if",
  description: "Executes one of two code blocks depending on a condition",
  brackets: true,
  type: FunctionType.Scope,
  output: "void",
  args: [
    {
      name: "condition",
      description: "The condition to evaluate (truthy/falsy)",
      condition: true,
      rest: false,
      required: true,
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      save: false,
    },
    {
      name: "then",
      description: "The code to run if the condition is truthy",
      rest: false,
      required: true,
      type: ArgType.String,
      raw: true,
      save: false,
    },
    {
      name: "else",
      description: "The code to run if the condition is falsy",
      rest: false,
      required: false,
      type: ArgType.String,
      raw: true,
      save: false,
    },
  ],

  async transpile(ctx: Context, [conditionArg]) {
    const thenBody = await this.transpileCodeArg(1, ctx, true);
    if (!thenBody)
      return this.error(ctx, `"if" failed to transpile then-branch`);

    const thenCode = [thenBody.declarations.join("\n"), thenBody.code]
      .filter(Boolean)
      .join("\n");

    let code = `if (${conditionArg.code}) { ${thenCode} }`;

    // Optional else branch
    if (this.hasField(2)) {
      const elseBody = await this.transpileCodeArg(2, ctx, true);
      if (elseBody) {
        const elseCode = [elseBody.declarations.join("\n"), elseBody.code]
          .filter(Boolean)
          .join("\n");
        if (elseCode.trim()) code += ` else { ${elseCode} }`;
      }
    }

    return this.success(ctx, "void", code);
  },
});
