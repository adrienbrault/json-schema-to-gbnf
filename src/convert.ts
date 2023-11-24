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
  "[" ws01 (
            value
    ("," ws01 value)*
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

      const formatProperty = (property: string | number | undefined) =>
        undefined !== property ? `"\\"${property}\\":" ws01 ` : null;

      const formatRequired = (value: string, required: boolean) =>
        required ? value : `(${value})?`;

      if ("object" === schema.type) {
        gbnf[propertyGbnfName] =
          (formatProperty(keyIndex) ?? "") +
          '"{" ws01 ' +
          Object.keys(schema.properties ?? {})
            .map((property, index) =>
              formatRequired(
                (index === 0 ? "" : '"," ws01 ') +
                  jsonPointerToGbnfName(`${jsonPtr}/properties/${property}`),
                schema.required?.includes(property) ?? true
              )
            )
            .join(" ") +
          ' "}" ws01';
        return;
      }

      if (
        ["string", "number", "integer", "boolean", "null"].includes(
          schema.type
        ) &&
        parentSchema?.type !== "array"
      ) {
        gbnf[propertyGbnfName] = `${formatProperty(keyIndex)}${schema.type}`;
        return;
      }

      if (schema.type === "array") {
        console.log();
        if (!schema.items?.type) {
          gbnf[propertyGbnfName] = (formatProperty(keyIndex) ?? "") + "array";
        } else {
          // value ("," ws01 value)*
          gbnf[propertyGbnfName] =
            (formatProperty(keyIndex) ?? "") +
            `"[" ws01 (${schema.items?.type} (ws01 "," ws01 ${schema.items?.type})*)? ws01 "]"`;
        }
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
