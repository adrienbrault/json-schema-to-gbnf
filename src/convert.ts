import traverse, { SchemaObject } from "json-schema-traverse";

type JsonSchema = { [key: string]: any };

export const ebnfBase = `
value  ::= (object | array | string | number | boolean | null) ws

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
  "\\"" (string-char)* "\\""

string-char ::= [^"\\\\] | "\\\\" (["\\\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) # escapes

number ::= integer ("." [0-9]+)? ([eE] [-+]? [0-9]+)?
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
        undefined !== property ? `${formatLiteral(property)} ":" ws01 ` : "";

      const formatRequired = (value: string, required: boolean) =>
        required ? value : `(${value})?`;

      const formatLiteral = (value: string | number | boolean) =>
        typeof value === "string" ? `"\\"${value}\\""` : `"${value}"`;

      const formatAlternatives = (values: string[]) =>
        `(${values.join(" | ")})`;

      const formatStringLength = (
        value: string,
        minLength: number | undefined,
        maxLength: number | undefined
      ) => {
        if (minLength && maxLength) {
          return new Array(maxLength)
            .fill(value)
            .map(
              (value, index) =>
                value + (minLength && index + 1 > minLength ? "?" : "")
            )
            .join(" ");
        }

        if (minLength) {
          return new Array(minLength).fill(value).join(" ") + ` ${value}*`;
        }

        if (maxLength) {
          return new Array(maxLength).fill(`${value}?`).join(" ");
        }
      };

      const formatArrayLength = (
        value: string,
        minItems: number | undefined,
        maxItems: number | undefined
      ) => {
        const joinDelimiter = ` "," ws01 `;
        if (minItems && maxItems) {
          return (
            new Array(minItems).fill(value).join(joinDelimiter) +
            " " +
            new Array(maxItems - minItems)
              .fill(`("," ws01 ${value})?`)
              .join(" ")
          );
        }

        if (minItems) {
          return (
            new Array(minItems).fill(value).join(joinDelimiter) +
            ` ("," ws01 ${value})*`
          );
        }

        if (maxItems) {
          return (
            `(${value})? ` +
            new Array(maxItems - 1).fill(`("," ws01 ${value})?`).join(" ")
          );
        }
      };

      if ("object" === schema.type) {
        if (!schema.properties) {
          gbnf[propertyGbnfName] = formatProperty(keyIndex) + "object";
          return;
        }

        gbnf[propertyGbnfName] =
          formatProperty(keyIndex) +
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
          ' "}"';
        return;
      }

      if (Array.isArray(schema.enum)) {
        gbnf[propertyGbnfName] =
          formatProperty(keyIndex) +
          formatAlternatives(schema.enum.map(formatLiteral));
        return;
      }

      if (Array.isArray(schema.type)) {
        gbnf[propertyGbnfName] =
          formatProperty(keyIndex) + formatAlternatives(schema.type);
        return;
      }

      if (
        "string" === schema.type &&
        ("maxLength" in schema || "minLength" in schema)
      ) {
        gbnf[propertyGbnfName] =
          formatProperty(keyIndex) +
          `"\\"" ` +
          formatStringLength(
            "string-char",
            schema.minLength,
            schema.maxLength
          ) +
          ` "\\""`;
        return;
      }

      if (
        ["string", "number", "integer", "boolean", "null"].includes(
          schema.type
        ) &&
        ["properties", undefined].includes(parentKeyword)
      ) {
        gbnf[propertyGbnfName] = formatProperty(keyIndex) + schema.type;
        return;
      }

      if (schema.type === "array") {
        if ("minItems" in schema || "maxItems" in schema) {
          gbnf[propertyGbnfName] =
            formatProperty(keyIndex) +
            `"[" ws01 ${formatArrayLength(
              schema.items?.type ?? "value",
              schema.minItems,
              schema.maxItems
            )} ws01 "]"`;
        } else {
          if (!schema.items?.type) {
            gbnf[propertyGbnfName] = formatProperty(keyIndex) + "array";
          } else {
            gbnf[propertyGbnfName] =
              formatProperty(keyIndex) +
              `"[" ws01 (${schema.items?.type} (ws01 "," ws01 ${schema.items?.type})*)? ws01 "]"`;
          }
        }
        return;
      }

      if (Array.isArray(schema.anyOf)) {
        gbnf[propertyGbnfName] =
          formatProperty(keyIndex) +
          formatAlternatives(
            schema.anyOf.map((anyOfSchema) => anyOfSchema.type)
          );
        return;
      }

      if (schema.const !== undefined) {
        gbnf[propertyGbnfName] = `${formatProperty(keyIndex)}${formatLiteral(
          schema.const
        )}`;
        return;
      }
    }
  );

  gbnf["root"] += " ws01";

  return [
    ...Object.entries(gbnf).map(([name, content]) => `${name} ::= ${content}`),
    "",
    ebnfBase,
  ].join("\n");
}
