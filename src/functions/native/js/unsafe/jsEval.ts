import {
  AntamFunction,
  ArgType,
  Code,
  FunctionFlags,
  FunctionType,
} from "../../../../structure";
import type { TranspiledResultRunData } from "../../../../core/Transpiler";

export default new AntamFunction({
  name: "jsEval",
  aliases: ["js"],
  description: "Evaluates JavaScript code at runtime",
  brackets: true,
  type: FunctionType.Getter,
  flags: FunctionFlags.Experimental,
  output: ArgType.Unknown,
  args: [
    {
      name: "code",
      description: "JavaScript code to evaluate",
      rest: true,
      required: true,
      type: ArgType.String,
      save: false,
    },
  ],

  importFunctions: [
    [
      "jsEval",
      (code: string, data: TranspiledResultRunData) => {
        const evaluate = new Function(`return eval(${JSON.stringify(code)})`);
        return evaluate.call(data);
      },
    ],
  ],
  transpile(ctx, [code]) {
    return this.success(
      ctx,
      ArgType.Unknown,
      `f$jsEval(${Code.joinArguments(code.code)}, ${Code.reservedNames.data})`,
    );
  },
});
