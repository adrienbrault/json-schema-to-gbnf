# json-schema-to-gbnf

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

This project was created using `bun init` in bun v1.0.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Links:

- [GBNF Spec](https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md)
- [json.gbnf](https://github.com/ggerganov/llama.cpp/blob/master/grammars/json.gbnf)
- [json_arr.gbnf](https://github.com/ggerganov/llama.cpp/blob/master/grammars/json_arr.gbnf)

Alternatives to generate GBNF:

- https://github.com/ggerganov/llama.cpp/blob/master/examples/json-schema-to-grammar.py
- https://github.com/intrinsiclabsai/gbnfgen
- https://github.com/mudler/LocalAI/blob/v1.40.0/pkg/grammar/json_schema.go

Alternatives to llama.cpp for JSON constrained output:

- https://github.com/outlines-dev/outlines
- https://github.com/jmorganca/ollama/pull/830
- https://github.com/1rgs/jsonformer
- https://github.com/guidance-ai/guidance#context-free-grammars
- https://localai.io/features/openai-functions/
- https://github.com/noamgat/lm-format-enforcer
- https://github.com/thiggle/api#context-free-grammar-completion-api
- https://github.com/rizerphe/local-llm-function-calling
