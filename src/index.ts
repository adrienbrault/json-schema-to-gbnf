import { convertJsonSchemaToGbnf } from "./convert";

const schema = JSON.parse(Bun.argv[2]);

console.log(convertJsonSchemaToGbnf(schema));
