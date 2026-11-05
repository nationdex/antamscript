import {
  AntamFunction,
  ArgType,
  Code,
  Context,
  FunctionFlags,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "transpile",
  description: "Transpiles AntamScript code at runtime",
  brackets: true,
  type: FunctionType.Getter,
  flags: FunctionFlags.Experimental,
  output: ArgType.Unknown,
  args: [
    {
      name: "minify",
      description: "Whether to minify the transpiled code",
      required: true,
      type: ArgType.Boolean,
      save: false,
      rest: false,
    },
    {
      name: "code",
      description: "AntamScript code to transpile and execute",
      rest: true,
      required: true,
      type: ArgType.String,
      save: false,
      raw: false,
    },
  ],

  importFunctions: ["eval"],
  transpile(ctx, [minify, code]) {
    return this.success(
      ctx,
      ArgType.Unknown,
      `(await f$eval(${Code.joinArguments(code.code)}, ${Code.reservedNames.data}, true))[${minify.code} ? "minifiedCode" : "code"]`,
    );
  },
});
