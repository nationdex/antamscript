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
      allow: [ArgType.Number],
      required: false,
      save: false,
    },
    {
      name: "max",
      description: "The maximum value (inclusive), defaults to 1",
      rest: false,
      type: ArgType.Number,
      allow: [ArgType.Number],
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
    const mn = `Number(String(${min.code} ?? "0").trim())`;
    const mx = `Number(String(${max.code} ?? "1").trim())`;
    const code = `(()=> { const r = f$random(${mn}, ${mx}); return (${decimals.code} ?? false) ? r : Math.floor(r);})()`;
    return this.success(ctx, ArgType.Number, code);
  },
});
