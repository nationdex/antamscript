import { AntamFunction, ArgType, AllowedArgTypePreset, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "ternary",
  aliases: ["ifValue"],
  description: "Returns one of two values depending on a condition",
  type: FunctionType.Getter,
  output: ArgType.Unknown,
  brackets: true,
  args: [
    {
      name: "condition",
      description: "The condition to evaluate",
      type: ArgType.Boolean,
      allow: AllowedArgTypePreset.Any,
      condition: true,
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "true value",
      description: "The value to return when the condition is true",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "false value",
      description: "The value to return when the condition is false",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [condition, whenTrue, whenFalse]) {
    return this.success(
      ctx,
      ArgType.Unknown,
      `(${condition.code} ? (${whenTrue.code}) : (${whenFalse.code}))`,
    );
  },
});
