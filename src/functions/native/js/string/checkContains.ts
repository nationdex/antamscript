import { AntamFunction, ArgType, AllowedArgTypePreset, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "checkContains",
  aliases: ["includes"],
  description: "Checks if a string contains a substring",
  type: FunctionType.Getter,
  output: ArgType.Boolean,
  brackets: true,
  args: [
    {
      name: "string",
      description: "The source string",
      rest: false,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
    {
      name: "matches",
      description: "The substring to search for",
      rest: true,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
  ],

  transpile(ctx, [str, matches]) {
    let code = `${matches.code}.some((match) => ${str.code}.includes(match))`;
    return this.success(ctx, ArgType.Boolean, code);
  },
});
