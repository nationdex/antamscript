import { AllowedArgTypePreset, AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "or",
  description: "Logical OR across two or more conditions",
  type: FunctionType.Getter,
  output: ArgType.Boolean,
  brackets: true,
  args: [
    {
      name: "conditions",
      description: "The conditions to evaluate with OR",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      condition: true,
      required: true,
      rest: true,
      save: false,
    },
  ],
  transpile(ctx, [conditions]) {
    const code = `${conditions.code}?.some((c) => Boolean(c)) ?? false`;
    return this.success(ctx, ArgType.Boolean, `(${code})`);
  },
});
