import { AntamFunction, ArgType, Code, FunctionType } from "../../../structure";

export default new AntamFunction({
  name: "message",
  description:
    "Returns all command arguments or one argument by zero-based index",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: false,
  args: [
    {
      name: "index",
      description: "Zero-based argument index",
      type: ArgType.Number,
      required: false,
      rest: false,
      save: true,
    },
  ],
  transpile(ctx, [index]) {
    return this.success(
      ctx,
      ArgType.String,
      `(typeof ${index.variable} == "number" ? ${Code.reservedNames.discord}.args[${index.variable}] :  ${Code.reservedNames.discord}.args.join(" ")) ?? ""`,
    );
  },
});
