import { convertJsonSchemaToGbnf } from "./src/convert";

const schema = JSON.parse(Bun.argv[2]);

console.log(convertJsonSchemaToGbnf(schema));
