import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "textLength",
  aliases: ["charCount"],
  description: "Returns the character count of a string",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "string",
      description: "The string to get the length of",
      rest: false,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
  ],

  transpile(ctx, [value]) {
    const code = `${value.code}.length`;
    return this.success(ctx, ArgType.Number, code);
  },
});
