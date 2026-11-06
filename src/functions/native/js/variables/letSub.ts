import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "letSub",
  description: "Subtracts an amount from an existing variable",
  type: FunctionType.Setter,
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
  transpile(ctx) {
    const [variable, amount] = this.resolveArgsFrom(0);
    const scope = `${Code.reservedNames.context}.scope`;
    const current = `Number(${scope}.getVariable(${variable.code}))`;
    return this.success(
      ctx,
      "void",
      `${scope}.setVariable(${variable.code}, (${current} - Number(${amount.code})))`,
    );
  },
});
