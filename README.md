Convert a [JSON-Schema][json_schema] to a [GBNF grammar][gbnf_grammar], to use with [llama.cpp][llama.cpp_contrained_output].

This implementation aims to support more of the JSON-Schema specification than [alternatives](#alternatives).

Use it online: [adrienbrault.github.io/json-schema-to-gbnf][web_url]

# Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts "<json schema>"
```

To build and run the website:

```bash
bun run build-site
bunx serve build
```

To run tests in watch mode when developing:

```bash
bun test --watch
```

# Resources

- [GBNF Spec][gbnf_grammar]
- [json.gbnf](https://github.com/ggerganov/llama.cpp/blob/master/grammars/json.gbnf)
- [json_arr.gbnf](https://github.com/ggerganov/llama.cpp/blob/master/grammars/json_arr.gbnf)

## Alternatives

The following are alternative JSON-Schema to GBNF converters:

- https://github.com/ggerganov/llama.cpp/blob/master/examples/json-schema-to-grammar.py
- https://github.com/intrinsiclabsai/gbnfgen
- https://github.com/mudler/LocalAI/blob/v1.40.0/pkg/grammar/json_schema.go

## llama.cpp alternatives for JSON constrained output

- https://github.com/outlines-dev/outlines
- https://github.com/jmorganca/ollama/pull/830
- https://github.com/1rgs/jsonformer
- https://github.com/guidance-ai/guidance#context-free-grammars
- https://localai.io/features/openai-functions/
- https://github.com/noamgat/lm-format-enforcer
- https://github.com/thiggle/api#context-free-grammar-completion-api
- https://github.com/rizerphe/local-llm-function-calling

[json_schema]: https://json-schema.org
[gbnf_grammar]: https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md
[llama.cpp_contrained_output]: https://github.com/ggerganov/llama.cpp#constrained-output-with-grammars
[web_url]: https://adrienbrault.github.io/json-schema-to-gbnf/
