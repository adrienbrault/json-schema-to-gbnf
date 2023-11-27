import {
  Expression,
  AstRegExp,
  Char,
  AstClass,
  Assertion,
} from "regexp-tree/ast";
import { formatStringLength } from "./convert";
import { e } from "../build";

const regexpTree = require("regexp-tree");

// Docs: https://github.com/DmitrySoshnikov/regexp-tree#ast-nodes-specification

function isAllOfType<T extends Expression>(
  expressions: Expression[],
  type: AstClass
): expressions is T[] {
  return expressions.every((expression) => expression.type === type);
}

function convertAstToGbnf(ast: Expression | null): string {
  if (null === ast) {
    throw new Error("Unsupported null expression.");
  }

  if ("Disjunction" === ast.type) {
    return [ast.left, ast.right].map(convertAstToGbnf).join(" | ");
  }
  if ("Alternative" === ast.type && Array.isArray(ast.expressions)) {
    if (
      isAllOfType<Char>(ast.expressions, "Char") &&
      ast.expressions.every((exp: Char) => exp.kind === "simple")
    ) {
      return `"${ast.expressions
        .map((expression: Char) => expression.value)
        .join("")}"`;
    }
    return ast.expressions.map(convertAstToGbnf).join(" ");
  }
  if ("Char" === ast.type) {
    if (ast.kind === "simple") {
      return `"${ast.value}"`;
    }
    if (ast.kind === "meta") {
      if (ast.value === "\\w") {
        return "[0-9A-Za-z_]";
      }
      if (ast.value === ".") {
        return "string-char";
      }
    }
  }
  if ("Repetition" === ast.type) {
    if (["+", "?", "*"].includes(ast.quantifier.kind)) {
      const expressionGbnf = convertAstToGbnf(ast.expression);
      return expressionGbnf.endsWith("]") || expressionGbnf.endsWith(")")
        ? `${convertAstToGbnf(ast.expression)}${ast.quantifier.kind}`
        : `(${convertAstToGbnf(ast.expression)})${ast.quantifier.kind}`;
    }
    if ("Range" === ast.quantifier.kind) {
      return formatStringLength(
        convertAstToGbnf(ast.expression),
        ast.quantifier.from,
        ast.quantifier.to
      );
    }
  }
  if ("CharacterClass" === ast.type) {
    if (ast.expressions?.length === 1) {
      const expression = ast.expressions[0];
      if ("ClassRange" === expression.type) {
        return regexpTree.generate(ast);
      }
    }
  }
  if ("Group" === ast.type) {
    return `(${convertAstToGbnf(ast.expression)})`;
  }
  throw new Error(
    `Unsupported regexp AST: ${regexpTree.generate(ast)} - ${JSON.stringify(
      ast
    )}`
  );
}

export function convertRegexpToGbnf(regexp: string): string {
  let parsed: AstRegExp;
  try {
    parsed = regexpTree.parse(regexp);
  } catch (error) {
    parsed = regexpTree.parse(new RegExp(regexp));
  }

  if (
    null === parsed.body ||
    ("Group" === parsed.body.type && null === parsed.body.expression)
  ) {
    return "(string-char)*";
  }

  let hasBeginMarker = false;
  let hasEndMarker = false;

  let ast = parsed.body;
  if (parsed.body.type === "Alternative") {
    let expressions = parsed.body.expressions;
    if (expressions[0].type === "Assertion" && expressions[0].kind === "^") {
      expressions = expressions.slice(1);
      hasBeginMarker = true;
    }
    if (
      expressions.at(-1)?.type === "Assertion" &&
      (expressions.at(-1) as Assertion)?.kind === "$"
    ) {
      expressions = expressions.slice(0, -1);
      hasEndMarker = true;
    }

    ast = {
      ...ast,
      type: "Alternative",
      expressions,
    };
  }

  let gbnf = convertAstToGbnf(ast);

  if (!hasBeginMarker) {
    gbnf = `(string-char)* ${gbnf}`;
  }
  if (!hasEndMarker) {
    gbnf = `${gbnf} (string-char)*`;
  }

  return gbnf;
}
