import {
  AntamFunction,
  ArgType,
  AllowedArgTypePreset,
  Code,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "toUpperCase",
  aliases: ["upper"],
  description: "Makes a string uppercase",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "string",
      description: "The string to turn uppercase",
      rest: true,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
  ],

  transpile(ctx, [values]) {
    let code = `${Code.joinArguments(values.code)}.toUpperCase()`;
    return this.success(ctx, ArgType.String, code);
  },
});
