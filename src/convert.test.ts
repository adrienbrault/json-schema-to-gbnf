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
root-name ::= "\\"name\\":" ws01 string

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
        type: "integer",
      },
      active: {
        type: "boolean",
      },
      nullable: {
        type: "null",
      },
      weight: {
        type: "number",
      },
    },
    required: ["name", "age"],
  };

  const expectedGbnf = `
root ::= "{" ws01 root-name "," ws01 root-age ("," ws01 root-active)? ("," ws01 root-nullable)? ("," ws01 root-weight)? "}" ws01
root-name ::= "\\"name\\":" ws01 string
root-age ::= "\\"age\\":" ws01 integer
root-active ::= "\\"active\\":" ws01 boolean
root-nullable ::= "\\"nullable\\":" ws01 null
root-weight ::= "\\"weight\\":" ws01 number

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema with nested objects", () => {
  const jsonSchema = {
    type: "object",
    properties: {
      friend: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      },
    },
    required: ["friend"],
  };

  const expectedGbnf = `
root ::= "{" ws01 root-friend "}" ws01
root-friend ::= "\\"friend\\":" ws01 "{" ws01 root-friend-name "}" ws01
root-friend-name ::= "\\"name\\":" ws01 string

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema with arrays", () => {
  const jsonSchema = {
    type: "object",
    properties: {
      notes: {
        type: "array",
      },
      ages: {
        type: "array",
        items: {
          type: "integer",
        },
      },
    },
  };

  const expectedGbnf = `
root ::= "{" ws01 root-notes "," ws01 root-ages "}" ws01
root-notes ::= "\\"notes\\":" ws01 array
root-ages ::= "\\"ages\\":" ws01 "[" ws01 (integer (ws01 "," ws01 integer)*)? ws01 "]"

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema with anyOf", () => {
  const jsonSchema = {
    anyOf: [{ type: "string" }, { type: "boolean" }],
  };

  const expectedGbnf = `
root ::= (string | boolean)

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});
