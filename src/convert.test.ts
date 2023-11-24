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
root-name ::= "\\"name\\"" ":" ws01 string
root-age ::= "\\"age\\"" ":" ws01 integer
root-active ::= "\\"active\\"" ":" ws01 boolean
root-nullable ::= "\\"nullable\\"" ":" ws01 null
root-weight ::= "\\"weight\\"" ":" ws01 number

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
root-friend ::= "\\"friend\\"" ":" ws01 "{" ws01 root-friend-name "}"
root-friend-name ::= "\\"name\\"" ":" ws01 string

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
root-notes ::= "\\"notes\\"" ":" ws01 array
root-ages ::= "\\"ages\\"" ":" ws01 "[" ws01 (root-ages-items (ws01 "," ws01 root-ages-items)*)? ws01 "]"
root-ages-items ::= integer

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
root ::= (string | boolean) ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema with const", () => {
  const jsonSchema = {
    const: "foo",
  };

  const expectedGbnf = `
root ::= "\\"foo\\"" ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema with enum", () => {
  const jsonSchema = {
    enum: ["foo", "bar"],
  };

  const expectedGbnf = `
root ::= ("\\"foo\\"" | "\\"bar\\"") ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema with string enum", () => {
  const jsonSchema = {
    type: "string",
    enum: ["foo", "bar"],
  };

  const expectedGbnf = `
root ::= ("\\"foo\\"" | "\\"bar\\"") ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert object Schema without properties", () => {
  const jsonSchema = {
    type: "object",
  };

  const expectedGbnf = `
root ::= object ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert object Schema without properties", () => {
  const jsonSchema = {
    type: ["string", "null"],
  };

  const expectedGbnf = `
root ::= (string | null) ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert object Schema with a string that has a minLength", () => {
  const jsonSchema = {
    type: "string",
    minLength: 5,
  };

  const expectedGbnf = `
root ::= "\\"" string-char string-char string-char string-char string-char string-char* "\\"" ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert object Schema with a string that has a maxLength", () => {
  const jsonSchema = {
    type: "string",
    maxLength: 5,
  };

  const expectedGbnf = `
root ::= "\\"" string-char? string-char? string-char? string-char? string-char? "\\"" ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert object Schema with a string that has a minLength and maxLength", () => {
  const jsonSchema = {
    type: "string",
    minLength: 3,
    maxLength: 5,
  };

  const expectedGbnf = `
root ::= "\\"" string-char string-char string-char string-char? string-char? "\\"" ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema array with minItems", () => {
  const jsonSchema = {
    type: "array",
    minItems: 3,
  };

  const expectedGbnf = `
root ::= "[" ws01 value "," ws01 value "," ws01 value ("," ws01 value)* ws01 "]" ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema array with maxItems", () => {
  const jsonSchema = {
    type: "array",
    maxItems: 3,
  };

  const expectedGbnf = `
root ::= "[" ws01 (value)? ("," ws01 value)? ("," ws01 value)? ws01 "]" ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema array with minItems and maxItems", () => {
  const jsonSchema = {
    type: "array",
    minItems: 3,
    maxItems: 5,
  };

  const expectedGbnf = `
root ::= "[" ws01 value "," ws01 value "," ws01 value ("," ws01 value)? ("," ws01 value)? ws01 "]" ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema nullable string", () => {
  const jsonSchema = {
    type: "string",
    nullable: true,
  };

  const expectedGbnf = `
root ::= (string | null) ws01

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});

test("Convert Schema array of objects with properties", () => {
  const jsonSchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    },
  };

  const expectedGbnf = `
root ::= \"[\" ws01 (root-items (ws01 \",\" ws01 root-items)*)? ws01 \"]\" ws01
root-items ::= \"{\" ws01 root-items-name \"}\"
root-items-name ::= \"\\\"name\\\"\" \":\" ws01 string

${ebnfBase}
`;

  const resultGbnf = convertJsonSchemaToGbnf(jsonSchema);

  expect(resultGbnf).toBe(expectedGbnf.trim());
});
