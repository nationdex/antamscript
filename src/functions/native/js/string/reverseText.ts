import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "reverseText",
  aliases: ["reverse"],
  description: "Returns the input text in reverse order",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "text",
      description: "The text to reverse",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [text]) {
    return this.success(
      ctx,
      ArgType.String,
      `Array.from(${text.code}).reverse().join("")`,
    );
  },
});
