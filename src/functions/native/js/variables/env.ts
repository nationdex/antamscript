import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "env",
  aliases: ["jsonDump"],
  description: "Retrieves an environment value",
  type: FunctionType.Getter,
  output: ArgType.Unknown,
  brackets: true,
  args: [
    {
      name: "key",
      description: "the key to retreive",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: true,
      save: false,
    },
  ],

  transpile(ctx, [name]) {
    const code = `${Code.reservedNames.context}.scope.getEnvironment(...${name.code})`;
    return this.successJSON(ctx, { json: code }, ArgType.Json);
  },
});
