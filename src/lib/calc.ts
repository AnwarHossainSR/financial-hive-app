// Safe arithmetic evaluator for amount fields and the quick calculator.
// Supports + - * / ( ) decimals, unary minus, "×" / "÷" and thousands commas.
// Never uses eval(); returns null for anything that isn't a valid expression.

const normalize = (input: string) =>
  input.replace(/,/g, "").replace(/[×xX]/g, "*").replace(/÷/g, "/").trim();

export function evaluateExpression(input: string): number | null {
  const src = normalize(input);
  if (!src) return null;

  let pos = 0;

  const skipSpaces = () => {
    while (src[pos] === " ") pos++;
  };

  const parseNumber = (): number | null => {
    skipSpaces();
    const match = /^\d+\.?\d*|^\.\d+/.exec(src.slice(pos));
    if (!match) return null;
    pos += match[0].length;
    return parseFloat(match[0]);
  };

  const parseFactor = (): number | null => {
    skipSpaces();
    const ch = src[pos];
    if (ch === "-" || ch === "+") {
      pos++;
      const value = parseFactor();
      return value === null ? null : ch === "-" ? -value : value;
    }
    if (ch === "(") {
      pos++;
      const value = parseSum();
      skipSpaces();
      if (value === null || src[pos] !== ")") return null;
      pos++;
      return value;
    }
    return parseNumber();
  };

  const parseProduct = (): number | null => {
    let left = parseFactor();
    while (left !== null) {
      skipSpaces();
      const op = src[pos];
      if (op !== "*" && op !== "/") break;
      pos++;
      const right = parseFactor();
      if (right === null) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  };

  function parseSum(): number | null {
    let left = parseProduct();
    while (left !== null) {
      skipSpaces();
      const op = src[pos];
      if (op !== "+" && op !== "-") break;
      pos++;
      const right = parseProduct();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const result = parseSum();
  skipSpaces();
  if (result === null || pos !== src.length || !Number.isFinite(result)) {
    return null;
  }
  // Trim floating-point noise (0.1 + 0.2) to 2 decimal places
  return Math.round(result * 100) / 100;
}

/** True when the input contains an operator, i.e. it's more than a plain number. */
export const isExpression = (input: string) =>
  /\d\s*[-+*/×÷xX]\s*[\d(]/.test(input.replace(/,/g, ""));

/**
 * Splits a calculator line like "120+30 rickshaw" into its arithmetic part and
 * an optional trailing label. Returns null when the leading part isn't valid.
 */
export function parseCalcLine(
  input: string,
): { value: number; expression: string; label: string } | null {
  const match = /^\s*([-+*/×÷().,\d\s]+)(.*)$/.exec(input);
  if (!match) return null;
  const expression = match[1].trim();
  const value = evaluateExpression(expression);
  if (value === null) return null;
  return { value, expression, label: match[2].trim() };
}
