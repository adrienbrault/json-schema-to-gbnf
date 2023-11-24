import { formatLiteral, formatStringLength } from "./convert";

const regexpTree = require("regexp-tree");

type AST = {
  type:
    | "RegExp"
    | "Disjunction"
    | "Char"
    | "Alternative"
    | "Repetition"
    | "CharacterClass"
    | "Group"
    | "ClassRange";
  expressions?: AST[];
} & {
  [key: string]: any;
};

function convertAstToGbnf(ast: AST): string {
  if ("RegExp" === ast.type) {
    return convertAstToGbnf(ast.body);
  }
  if ("Disjunction" === ast.type) {
    return [ast.left, ast.right].map(convertAstToGbnf).join(" | ");
  }
  if ("Alternative" === ast.type && Array.isArray(ast.expressions)) {
    const isAllChars = ast.expressions.every(
      (expression: AST) => expression.type === "Char"
    );
    if (isAllChars) {
      return `"${ast.expressions
        .map((expression) => expression.value)
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
  throw new Error(`Unsupported regexp AST: ${regexpTree.generate(ast)}`);
}

export function convertRegexpToGbnf(regexp: string): string {
  let parsed;
  try {
    parsed = regexpTree.parse(regexp);
  } catch (error) {
    parsed = regexpTree.parse(new RegExp(regexp));
  }

  return convertAstToGbnf(parsed);
}
