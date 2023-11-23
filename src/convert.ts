import traverse, { SchemaObject } from "json-schema-traverse";

type JsonSchema = {
  type: string;
  properties?: { [key: string]: { type: string } };
  required?: string[];
};

export const ebnfBase = `
value  ::= object | array | string | number | (boolean | null) ws

object ::=
  "{" ws (
    string ":" ws value
    ("," ws string ":" ws value)*
  )? "}"

array  ::=
  "[" ws (
            value
    ("," ws value)*
  )? "]"

string ::=
  "\\"" (
    [^"\\\\] |
    "\\\\" (["\\\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) # escapes
  )* "\\""

number ::= ("-"? ([0-9] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)?
integer ::= ("-"? ([0-9] | [1-9] [0-9]*))
boolean ::= ("true" | "false")
null ::= "null"

# Optional space: by convention, applied in this grammar after literal chars when allowed
ws ::= ([ \\t\\n] ws)?
ws01 ::= ([ \\t\\n])?`;

function jsonPointerToGbnfName(jsonPtr: string): string {
  if ("" === jsonPtr) {
    return "root";
  }

  return (
    "root" +
    jsonPtr.replace(/\/properties/g, "").replace(/[^a-zA-Z0-9-]+/g, "-")
  );
}

export function convertJsonSchemaToGbnf(jsonSchema: JsonSchema): string {
  type Gbnf = { [key: string]: string };
  let gbnf: Gbnf = {};

  traverse(
    jsonSchema,
    (
      schema: SchemaObject,
      jsonPtr: string,
      rootSchema: SchemaObject,
      parentJsonPtr?: string,
      parentKeyword?: string,
      parentSchema?: SchemaObject,
      keyIndex?: string | number
    ) => {
      let propertyGbnfName = jsonPointerToGbnfName(jsonPtr);

      if ("object" === schema.type) {
        gbnf[propertyGbnfName] = [
          ...(keyIndex !== undefined ? [`"\\"${keyIndex}\\":" ws01`] : []),
          '"{" ws01',
          Object.keys(schema.properties ?? {})
            .map((property) =>
              jsonPointerToGbnfName(`${jsonPtr}/properties/${property}`)
            )
            .join(` "," ws01 `),
          '"}" ws01',
        ].join(" ");
        return;
      }

      if (
        ["string", "number", "integer", "boolean", "null"].includes(schema.type)
      ) {
        gbnf[propertyGbnfName] = `"\\"${keyIndex}\\":" ws01 ${schema.type}`;
        return;
      }
    }
  );

  return [
    ...Object.entries(gbnf).map(([name, content]) => `${name} ::= ${content}`),
    "",
    ebnfBase,
  ].join("\n");
}
