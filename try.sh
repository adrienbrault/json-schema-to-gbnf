#!/usr/bin/env bash

JSON_SCHEMA='{
    "type": "object",
    "properties": {
        "name": {
            "type": "string"
        },
        "population": {
            "type": "integer"
        },
        "touristic": {
            "type": "boolean"
        },
        "wtf": {
            "type": "string",
            "nullable": true
        },
        "mayor": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string"
                },
                "hometown": {
                    "type": "string"
                }
            }
        },
        "nicknames": {
            "type": "array",
            "items": {
                "type": "string",
                "nullable": true
            },
            "minItems": 7
        },
        "weather": {
            "type": "string",
            "enum": ["sunny", "rainy", "cloudy", "snowy"]
        },
        "randomFact": {
            "type": "string",
            "pattern": "[0-9]+ \\w+"
        }
    }
}'
JSON_SCHEMA="${1:-$JSON_SCHEMA}"

USER="New york city."
USER="${2:-$USER}"
set -xe

GRAMMAR="$(bun run ../json-schema-to-gbnf/index.ts "${JSON_SCHEMA}")"
SYSTEM="You are a very accurate assistant that only writes JSON, strictly following the user instructions."

echo -e "GRAMMAR\n=======\n\n${GRAMMAR}\n\n"

MODEL="${HOME}/.cache/lm-studio/models/TheBloke/OpenHermes-2.5-Mistral-7B-GGUF/openhermes-2.5-mistral-7b.Q4_K_M.gguf"
MODEL="${3:-$MODEL}"

../llama.cpp/main \
    -m "${MODEL}" \
    --color \
    -c 2048 \
    --temp 0.7 \
    --repeat_penalty 1.1 \
    -n \
    -1 \
    -p "<|im_start|>system\n${SYSTEM}<|im_end|>\n<|im_start|>user\n${USER}<|im_end|>\n<|im_start|>assistant" \
    -n 400 \
    --grammar "${GRAMMAR}"