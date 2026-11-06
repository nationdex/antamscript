import {
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

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
    {
      name: "end index",
      description: "The end index",
      rest: false,
      type: ArgType.Number,
      required: false,
      save: true,
    },
  ],
  transpile(ctx, [index, endIndex]) {
    return this.success(
      ctx,
      ArgType.String,
      `( typeof ${index.variable} == "number" ? (typeof ${endIndex.variable} == "number" ? ${Code.reservedNames.discord}.args.slice(${index.variable}, ${endIndex.variable}).join(" ") : ${Code.reservedNames.discord}.args[${index.variable}]) : ${Code.reservedNames.discord}.args.join(" "))`,
    );
  },
});
