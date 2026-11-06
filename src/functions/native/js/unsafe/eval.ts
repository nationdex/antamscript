import {
  AntamFunction,
  ArgType,
  Code,
  FunctionFlags,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "eval",
  aliases: ["antamEval"],
  description: "Transpiles and runs AntamScript code at runtime",
  brackets: true,
  type: FunctionType.Getter,
  flags: FunctionFlags.Experimental,
  output: ArgType.Unknown,
  args: [
    {
      name: "code",
      description: "AntamScript code to transpile and execute",
      rest: false,
      required: true,
      type: ArgType.String,
      save: false,
    },
  ],

  importFunctions: ["eval"],
  transpile(ctx, [code]) {
    return this.success(
      ctx,
      ArgType.Unknown,
      `await f$eval(${code.code}, ${Code.reservedNames.data}, false)`,
    );
  },
});
