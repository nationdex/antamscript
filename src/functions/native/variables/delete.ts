import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "delete",
  aliases: ["deleteVariable"],
  description: "Deletes a script variable",
  type: FunctionType.Setter,
  output: "void",
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
      "void",
      `${Code.reservedNames.context}.scope.deleteVariable(${name.code})`,
    );
  },
});
