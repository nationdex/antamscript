import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "isJSON",
  aliases: ["isValidJSON"],
  description: "Checks whether given JSON is valid",
  type: FunctionType.Getter,
  output: ArgType.Boolean,
  brackets: true,
  args: [
    {
      name: "json",
      description: "The value to check",
      type: ArgType.Unknown,
      required: true,
      rest: false,
      save: false,
    },
  ],

  importFunctions: ["isValidJSON"],
  transpile(ctx, [json]) {
    const code = `f$isValidJSON(${json.code})`;

    return this.success(ctx, ArgType.Boolean, code);
  },
});
