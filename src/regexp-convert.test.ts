import { expect, test } from "bun:test";
import { convertRegexpToGbnf } from "./regexp-convert";

const tests: Array<[string, string]> = [
  ["[0-9]+( days| weeks| months)?", `[0-9]+ (" days" | " weeks" | " months")?`],
  [
    "[0-9]+ ( days| weeks| months)?",
    `[0-9]+ " " (" days" | " weeks" | " months")?`,
  ],
  ["[0-9]{2,4}", `[0-9] [0-9] [0-9]? [0-9]?`],
  ["[0-9]{0,4}", `[0-9]? [0-9]? [0-9]? [0-9]?`],
  ["[0-9]{2,}", `[0-9] [0-9] [0-9]*`],
  ["\\w", `[0-9A-Za-z_]`],
  ["\\w+", `[0-9A-Za-z_]+`],
  ["\\w{0,2}", `[0-9A-Za-z_]? [0-9A-Za-z_]?`],
  ["\\w{3,}", `[0-9A-Za-z_] [0-9A-Za-z_] [0-9A-Za-z_] [0-9A-Za-z_]*`],
  ["\\.", `"."`],
  [".", `string-char`],
  ["", `(string-char)*`],
];

tests.forEach(([regexp, gbnf]) => {
  test(`Convert Regexp: ${regexp}`, () => {
    const resultGbnf = convertRegexpToGbnf(regexp);
    expect(resultGbnf).toBe(gbnf);
  });
});
