import { Expression, AstRegExp, Char, AstClass } from "regexp-tree/ast";
import { formatStringLength } from "./convert";

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
    if (isAllOfType<Char>(ast.expressions, "Char")) {
      return `"${ast.expressions
        .map((expression: Char) => expression.value)
        .join("")}"`;
    }
    return ast.expressions.map(convertAstToGbnf).join(" ");
  }
  if ("Char" === ast.type) {
    if (ast.kind !== "meta") {
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
    if (["+", "?"].includes(ast.quantifier.kind)) {
      return `${convertAstToGbnf(ast.expression)}${ast.quantifier.kind}`;
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

  return convertAstToGbnf(parsed.body);
}
