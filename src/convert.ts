import traverse, { SchemaObject } from "json-schema-traverse";
import { convertRegexpToGbnf } from "./regexp-convert";

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
integer ::= "-"? ([0-9] | [1-9] [0-9]*)
boolean ::= "true" | "false"
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

export const formatLiteral = (value: string | number | boolean) =>
  typeof value === "string" ? `"\\___"${value}\\""` : `"${value}"`;

export const formatAlternatives = (values: string[]) =>
  `(${values.join(" | ")})`;

export const formatStringLength = (
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

  throw new Error("Either minLength or maxLength must be defined");
};

const formatProperty = (property: string | number | undefined) =>
  undefined !== property ? `${formatLiteral(property)} ":" ws01 ` : "";

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

      const formatRequired = (value: string, required: boolean) =>
        required ? value : `(${value})?`;

      const formatNullable = (
        value: string,
        nullable?: boolean | undefined
      ) => {
        if ((nullable ?? schema.nullable) !== true) {
          return value;
        }

        return formatAlternatives([value, "null"]);
      };

      const gbnfAdd = (value: string) => {
        gbnf[propertyGbnfName] =
          formatProperty(keyIndex) + formatNullable(value);
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

      const formatSchema = (
        schema: SchemaObject,
        jsonPtr: string,
        parentKeyword?: string
      ): string | undefined => {
        if ("object" === schema.type) {
          if (!schema.properties) {
            return "object";
          }

          return (
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
            ' "}"'
          );
        }

        if (Array.isArray(schema.enum)) {
          return formatAlternatives(schema.enum.map(formatLiteral));
        }

        if (Array.isArray(schema.type)) {
          return formatAlternatives(schema.type);
        }

        if (
          "string" === schema.type &&
          ("maxLength" in schema || "minLength" in schema)
        ) {
          return (
            `"\\"" ` +
            formatStringLength(
              "string-char",
              schema.minLength,
              schema.maxLength
            ) +
            ` "\\""`
          );
        }

        if ("pattern" in schema && schema.type === "string") {
          return `"\\"" ${convertRegexpToGbnf(schema.pattern)} "\\""`;
        }

        if (
          ["string", "number", "integer", "boolean", "null"].includes(
            schema.type
          ) &&
          ["properties", "items", undefined].includes(parentKeyword)
        ) {
          return schema.type;
        }

        if (schema.type === "array") {
          if ("minItems" in schema || "maxItems" in schema) {
            return `"[" ws01 ${formatArrayLength(
              formatNullable(
                (undefined !== schema.items
                  ? jsonPointerToGbnfName(jsonPtr + "/items")
                  : null) ?? "value",
                schema.items?.nullable
              ),
              schema.minItems,
              schema.maxItems
            )} ws01 "]"`;
          }
          const formatted =
            undefined !== schema.items
              ? jsonPointerToGbnfName(jsonPtr + "/items")
              : null;
          if (!formatted) {
            return "array";
          }
          const value = formatNullable(formatted, schema.items?.nullable);
          return `"[" ws01 (${value} (ws01 "," ws01 ${value})*)? ws01 "]"`;
        }

        if (schema.const !== undefined) {
          return formatLiteral(schema.const);
        }

        if (Array.isArray(schema.anyOf)) {
          return formatAlternatives(
            schema.anyOf.map((anyOfSchema) => anyOfSchema.type)
          );
        }

        return undefined;
      };

      const formatted = formatSchema(schema, jsonPtr, parentKeyword);
      if (formatted !== undefined) {
        gbnfAdd(formatted);
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
