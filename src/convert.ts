type JsonSchema = {
  type: string;
  properties?: { [key: string]: { type: string } };
  required?: string[];
};

export const ebnfBase = `
value  ::= object | array | string | number | ("true" | "false" | "null") ws

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

number ::= ("-"? ([0-9] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)? ws

# Optional space: by convention, applied in this grammar after literal chars when allowed
ws ::= ([ \\t\\n] ws)?
ws01 ::= ([ \\t\\n])?`;

export function convertJsonSchemaToGbnf(jsonSchema: JsonSchema): string {
  if (jsonSchema.type !== "object" || !jsonSchema.properties) {
    throw new Error("Currently, only simple object schemas are supported");
  }

  type Gbnf = { [key: string]: string };
  let gbnf: Gbnf = {};

  const objectDefinition = [];
  for (const propName in jsonSchema.properties) {
    const propType = jsonSchema.properties[propName].type;

    const propertyGbnfName = `root-${propName}`;
    gbnf[propertyGbnfName] = `"\\"${propName}\\"" ":" ws01 ${propType}`;
    objectDefinition.push(propertyGbnfName);
  }

  gbnf["root"] = [
    '"{" ws01',
    objectDefinition.join(` "," ws01 `),
    '"}" ws01',
  ].join(" ");

  return [
    ...Object.entries(gbnf).map(([name, content]) => `${name} ::= ${content}`),
    "",
    ebnfBase,
  ].join("\n");
}
