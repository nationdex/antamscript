import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "return",
  description:
    "Immediately stops execution and returns a value from the current code block or custom function",
  brackets: false,
  type: FunctionType.Scope,
  output: "void",
  args: [
    {
      name: "value",
      description: "The value to return",
      rest: false,
      required: false,
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      save: false,
    },
  ],

  transpile(ctx, [value]) {
    const context = Code.reserved("context");
    const val = value?.code ?? "undefined";
    const code = `return ${context}.return(${val});`;
    return this.success(ctx, "void", code);
  },
});
