import { expect, test } from "bun:test";
import { convertJsonSchemaToGbnf, ebnfBase } from "./convert"; // Assuming your converter function is named this way

test("Convert Schema with one string property", () => {
  const jsonSchema = {
    type: "object",
    properties: {
      name: {
        type: "string",
      },
    },
    required: ["name"],
  };

  const expectedGbnf = `
root ::= "{" ws01 root-name "}" ws01
root-name ::= "\\"name\\"" ":" ws01 string

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema with two properties", () => {
  const jsonSchema = {
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      age: {
        type: "number",
      },
    },
    required: ["name"],
  };

  const expectedGbnf = `
root ::= "{" ws01 root-name "," ws01 root-age "}" ws01
root-name ::= "\\"name\\"" ":" ws01 string
root-age ::= "\\"age\\"" ":" ws01 number

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});
