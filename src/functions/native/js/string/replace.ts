import {
  AntamFunction,
  ArgType,
  AllowedArgTypePreset,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "replace",
  description: "Replaces the first occurrence of a substring in a string",
  type: FunctionType.Getter,
  output: ArgType.String,
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
      name: "search",
      description: "The substring to search for",
      rest: false,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
    {
      name: "replacement",
      description: "The string to replace the match with",
      rest: false,
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      save: false,
    },
  ],

  transpile(ctx, [str, search, replacement]) {
    let code = `${str.code}.replace(${search.code}, ${replacement.code})`;
    return this.success(ctx, ArgType.String, code);
  },
});
