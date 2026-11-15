import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "argCount",
  aliases: ["argsCount"],
  description: "Counts the number of args in a message",
  type: FunctionType.Getter,
  brackets: false,
  args: [
    {
      name: "text",
      description: "Text to count arguments",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: true,
    },
  ],
  output: ArgType.Number,
  importFunctions: [
    [
      "argCount",
      (text: string | string[] | undefined) => {
        if (!text) return 0;
        if (Array.isArray(text)) return text.length;
        return text.trim().split(/ +/).filter(Boolean).length;
      },
    ],
  ],
  transpile(ctx, [text]) {
    return this.success(
      ctx,
      ArgType.Number,
      `f$argCount(${text.variable} ?? ${Code.reservedNames.discord}.args)`,
    );
  },
});
