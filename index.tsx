import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { convertJsonSchemaToGbnf } from "./src/convert";

const App = () => {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");

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
