import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { convertJsonSchemaToGbnf } from "./convert";

const defaultSchema = {
  type: "object",
  properties: {
    simpleString: {
      type: "string",
    },
    limitedLengthString: {
      type: "string",
      minLength: 5,
      maxLength: 20,
    },
    enumString: {
      type: "string",
      enum: ["option1", "option2", "option3"],
    },
    patternString: {
      type: "string",
      pattern: "^[0-9] .+$",
    },
    nullableString: {
      type: ["string", "null"],
    },
    integerField: {
      type: "integer",
    },
    numberField: {
      type: "number",
    },
    arrayField: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "string",
      },
    },
    subObject: {
      type: "object",
      properties: {
        subField1: { type: "number" },
        subField2: { type: "boolean" },
      },
      required: ["subField1"],
    },
  },
  required: [
    "simpleString",
    "limitedLengthString",
    "enumString",
    "patternString",
    "integerField",
    "numberField",
    "arrayField",
    "subObject",
  ],
};
const App = () => {
  const [input, setInput] = React.useState(
    JSON.stringify(defaultSchema, null, 2)
  );
  const [output, setOutput] = React.useState(
    convertJsonSchemaToGbnf(defaultSchema)
  );

  const handleConvert = () => {
    try {
      const schema = JSON.parse(input);
      const gbnf = convertJsonSchemaToGbnf(schema);
      setOutput(gbnf);
    } catch (error) {
      setOutput("Error in conversion: " + error.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter JSON Schema here"
          style={{ width: "50%", height: "400px" }}
        />
        <textarea
          value={output}
          readOnly
          placeholder="GGUF Output"
          style={{ width: "50%", height: "400px" }}
        />
      </div>
      <button onClick={handleConvert}>Convert</button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
