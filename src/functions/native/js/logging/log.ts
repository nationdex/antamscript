import {
  AntamFunction,
  ArgType,
  AllowedArgTypePreset,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "log",
  description: "Logs to the console",
  type: FunctionType.Getter,
  output: "void",
  brackets: true,
  args: [
    {
      name: "content",
      description: "The content to turn log",
      rest: true,
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      save: false,
    },
  ],

  transpile(ctx, [value]) {
    let code = `console.log(...${value.code})`;
    return this.success(ctx, "void", code);
  },
});
