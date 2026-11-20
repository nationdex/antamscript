import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "not",
  description: "Logical NOT (inverts a condition)",
  type: FunctionType.Getter,
  output: ArgType.Boolean,
  brackets: true,
  args: [
    {
      name: "condition",
      description: "The condition to invert",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      condition: true,
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [condition]) {
    return this.success(ctx, ArgType.Boolean, `(!Boolean(${condition.code}))`);
  },
});
