import { Parser } from "../../../../core";
import { AntamFunction, ArgType, AllowedArgTypePreset, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "c",
  aliases: ["comment"],
  description: "Adds a comment to the code",
  type: FunctionType.Getter,
  output: "void",
  brackets: true,
  args: [
    {
      name: "content",
      description: "The content to add as a comment",
      rest: true,
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      save: false,
      raw: true,
    },
  ],

  transpile(ctx, [value]) {
    let code = `/** ${JSON.parse(value.code).join(Parser.GlobalFunctionConfig.argSplitter)} */`;
    return this.success(ctx, "void", code);
  },
});
