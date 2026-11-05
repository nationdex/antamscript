import {
  AllowedArgTypePreset,
  AntamFunction,
  ArgType,
  FunctionType,
} from "../../../structure";

export default new AntamFunction({
  name: "randomString",
  aliases: ["randomstring"],
  description: "Generates a random string of the requested length",
  type: FunctionType.Getter,
  output: ArgType.String,
  brackets: true,
  args: [
    {
      name: "length",
      description: "The number of characters to generate",
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
      rest: false,
      save: false,
    },
    {
      name: "characters",
      description: "Optional characters to use; defaults to letters and digits",
      type: ArgType.String,
      allow: AllowedArgTypePreset.String,
      required: false,
      rest: false,
      save: false,
    },
  ],
  importFunctions: [
    [
      "randomString",
      (chars: string, length: number) => {
        if (!Number.isInteger(length) || length < 0)
          throw new RangeError("String length must be a non-negative integer");
        return Array.from(
          { length },
          () => chars[Math.floor(Math.random() * chars.length)] ?? "",
        ).join("");
      },
    ],
  ],
  transpile(ctx, [length, characters]) {
    const chars = `String(${characters.code} ?? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")`;
    const code = `f$randomString(${chars}, ${length.code})`;
    return this.success(ctx, ArgType.String, code);
  },
});
