# json-schema-to-gbnf

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts "<json schema>"
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
