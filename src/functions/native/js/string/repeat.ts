import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "repeat",
  description: "Repeats text the requested number of times",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "text",
      description: "The text to repeat",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "amount",
      description: "How many times to repeat the text",
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [text, amount]) {
    return this.success(
      ctx,
      ArgType.String,
      `${text.code}.repeat(Math.floor(${amount.code}))`,
    );
  },
});
