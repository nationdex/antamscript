import { getDiscordImportedFunctions } from "../../../discordjs/imported";
import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "escapeCode",
  aliases: ["esc"],
  description: "Escapes code",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "text",
      description: "The text to escape",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: true,
      save: false,
      raw: true,
    },
  ],
  transpile(ctx, [text]) {
    return this.success(ctx, ArgType.String, Code.joinArguments(text.code));
  },
});
