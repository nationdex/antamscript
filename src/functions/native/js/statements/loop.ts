import {
  AntamFunction,
  ArgType,
  Code,
  Context,
  FunctionFlags,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "loop",
  description: "Executes given code for N times",
  brackets: true,
  type: FunctionType.Scope,
  flags: FunctionFlags.Experimental,
  output: "void",
  args: [
    {
      name: "times",
      description: "How many times to run the code",
      rest: false,
      required: true,
      type: ArgType.Number,
      allow: [ArgType.Number],
      save: false,
    },
    {
      name: "code",
      description: "The code to execute on each iteration",
      rest: false,
      required: true,
      type: ArgType.String,
      raw: true,
      save: false,
    },
  ],

  async transpile(ctx: Context, [times]) {
    const body = await this.transpileCodeArg(1, ctx);
    if (!body) return this.error(ctx, `"loop" failed to transpile code body`);

    const bodyCode = [body.declarations.join("\n"), body.code].filter(Boolean).join("\n");

    const loopCode = Code.forLoop(times.code, bodyCode);
    return this.success(ctx, "void", loopCode);
  },
});
