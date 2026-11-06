import {
  AntamFunction,
  ArgType,
  AllowedArgTypePreset,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "typeof",
  description: "Returns the JavaScript type of a value",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "value",
      description: "The value to inspect",
      type: ArgType.Unknown,
      allow: AllowedArgTypePreset.Any,
      required: true,
      rest: false,
      save: false,
    },
  ],

  importFunctions: [
    [
      "typeOf",
      (value: any) => {
        if (typeof value !== "string") return typeof value;
        const text = value.trim();
        if (text === "true" || text === "false") return "boolean";
        if (text === "null") return "object";
        if (text === "undefined") return "undefined";
        if (/^-?\\d+n$/.test(text)) return "bigint";
        if (text !== "" && Number.isFinite(Number(text))) return "number";
        try {
          return typeof JSON.parse(text);
        } catch {
          return "string";
        }
      },
    ],
  ],
  transpile(ctx, [value]) {
    return this.success(ctx, ArgType.String, `f$typeOf(${value.code})`);
  },
});
