import { AntamFunction, ArgType, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "random",
  description: "Returns a random integer between min (inclusive) and max (inclusive)",
  type: FunctionType.Getter,
  output: ArgType.Number,
  brackets: true,
  args: [
    {
      name: "min",
      description: "The minimum value (inclusive), defaults to 0",
      rest: false,
      type: ArgType.Number,
      allow: [ArgType.Number, ArgType.String],
      required: false,
      save: false,
    },
    {
      name: "max",
      description: "The maximum value (inclusive), defaults to 1",
      rest: false,
      type: ArgType.Number,
      allow: [ArgType.Number, ArgType.String],
      required: false,
      save: false,
    },
    {
      name: "as decimals",
      description: "Returns the number as a decimal or not, defaults to false",
      rest: false,
      type: ArgType.Boolean,
      allow: [ArgType.Boolean],
      required: false,
      save: false,
    },
  ],

  importFunctions: ["random"],
  transpile(ctx, [min, max, decimals]) {
    const code = `f$random(${min.code} || undefined, ${max.code} || undefined, ${decimals.code} || undefined)`;
    return this.success(ctx, ArgType.Number, code);
  },
});
