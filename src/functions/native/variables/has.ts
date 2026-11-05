import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "has",
  aliases: ["hasVariable"],
  description: "Returns whether a script variable exists",
  type: FunctionType.Getter,
  output: ArgType.Boolean,
  brackets: true,
  args: [
    {
      name: "name",
      description: "The variable name",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: true,
      rest: false,
      save: false,
    },
  ],
  transpile(ctx, [name]) {
    return this.success(
      ctx,
      ArgType.Boolean,
      `${Code.reservedNames.context}.scope.hasVariable(${name.code})`,
    );
  },
});
