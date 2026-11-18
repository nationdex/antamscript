import { ICustomAntamFunction } from "../../../src";
export default {
  name: "randomCase",
  args: ["text"],
  code: `
    $if[$random[0;100]>50;$return[$lower[$env[text]]];$return[$upper[$env[text]]]]
    `,
} satisfies ICustomAntamFunction;
