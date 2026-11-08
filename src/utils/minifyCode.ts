import UglifyJS from "uglify-js";
import { version } from "../../package.json";

type CaptureGroups = Record<string, string>;

interface MinifierPatch {
  match: RegExp;
  onlyIf?: (match: string, groups: CaptureGroups) => boolean;
  replacement: string | ((match: string, groups: CaptureGroups) => string);
}

export function minifyCode(code: string, fix = 2, toplevel = true): string {
  const result = UglifyJS.minify(code, {
    toplevel,
    compress: {
      drop_console: false,
    },
    output: {
      comments: /^!/,
      preamble: `/* AntamScript@${version} */`,
    },
  });

  if (result.error) {
    throw new Error(`Minification failed: ${result.error}`);
  }

  if (fix == 0) return result.code;

  const fixed = fixMinifiedCode(result.code);
  if (fixed !== result.code) return minifyCode(fixed, fix - 1, toplevel);
  return fixed;
}

function fixMinifiedCode(code: string, fixAgain = true): string {
  const patches: MinifierPatch[] = [
    // convert all nested type class casts like Number(Number("123")) to Number("123")
    {
      match:
        /(?<![\w$.])(?<outer>Number|String|Boolean)\((?<inner>Number|String|Boolean)\((?<literal>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[-+]?\d+(?:\.\d+)?)\)\)/g,
      onlyIf: (_match, groups) => {
        return groups.outer === groups.inner;
      },
      replacement: (_match, groups) => {
        return `${groups.outer}(${groups.literal})`;
      },
    },

    // convert all String("text") to "text"
    {
      match: /(?<![\w$.])String\((?<literal>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\)/g,
      replacement: (_match, groups) => {
        return groups.literal;
      },
    },

    // convert all Number("123") or Number(123) to 123
    {
      match:
        /(?<![\w$.])Number\((?<quote>["']?)(?<value>[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|0[xX][\da-fA-F]+|0[bB][01]+|0[oO][0-7]+)\k<quote>\)/g,
      replacement: (_match, groups) => {
        return `${groups.value}`;
      },
    },

    // convert all Boolean("true") to true and Boolean("false") to false
    // also convert Boolean(true) to true and Boolean(false) to false
    // also Boolean(\d) to true if \d is not 0, and false if \d is 0
    // also Boolean(!0) to true and Boolean(!1) to false
    {
      match:
        /(?<![\w$.])Boolean\((?<quote>["'])(?<value>true|false)\k<quote>\)|(?<![\w$.])Boolean\((?<value2>[-+]?\d+\.?\d*)\)|(?<![\w$.])Boolean\((?<value3>!0|!1)\)/g,
      replacement: (_match, groups) => {
        return groups.value
          ? groups.value
          : groups.value3
            ? groups.value3 === "!0"
              ? "!0"
              : "!1"
            : Number(groups.value2) !== 0
              ? "!0"
              : "!1";
      },
    },
  ];

  let fixedCode = code;
  for (const patch of patches) {
    fixedCode = fixedCode.replace(patch.match, (match, ...args) => {
      const position = args.at(-3);
      const groups = args.at(-1);
      if (typeof position !== "number" || !groups || typeof groups !== "object")
        throw new TypeError("Minifier patch regex must define named capture groups");
      if (patch.onlyIf && !patch.onlyIf(match, groups)) {
        return match;
      }
      if (typeof patch.replacement === "string") {
        return patch.replacement;
      }
      return patch.replacement(match, groups);
    });
  }

  return fixAgain && fixedCode !== code ? fixMinifiedCode(fixedCode, false) : fixedCode;
}
