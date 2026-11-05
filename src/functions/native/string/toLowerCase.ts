import {
  AntamFunction,
  ArgType,
  AllowedArgTypePreset,
  Code,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "toLowerCase",
  aliases: ["lower"],
  description: "Makes a string lowercase",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "string",
      description: "The string to turn lowercase",
      rest: true,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
  ],

  transpile(ctx, [values]) {
    let code = `${Code.joinArguments(values.code)}.toLowerCase()`;
    return this.success(ctx, ArgType.String, code);
  },
});
