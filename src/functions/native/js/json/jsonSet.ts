import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
  Scope,
} from "../../../../structure";

export default new AntamFunction({
  name: "jsonSet",
  description: "Adds a JSON key with a value",
  type: FunctionType.Setter,
  output: "void",
  brackets: true,
  args: [
    {
      name: "keys;value",
      description: "The keys to traverse, with the value to use at the end",
      type: ArgType.Unknown,
      required: true,
      rest: true,
      save: true,
    },
  ],

  importFunctions: [
    "parseJSON",
    [
      "jsonSet",
      (scope: Scope, args: string[]) => {
        let value = args.pop()!;
        let keys = args;
        // @ts-ignore - f$parseJSON will be provided
        return scope.setEnvironment(keys, f$parseJSON(value));
      },
    ],
  ],
  transpile(ctx, [args]) {
    const code = `f$jsonSet(${Code.reservedNames.context}.scope, ${args.variable})`;
    return this.success(ctx, "void", code);
  },
});
