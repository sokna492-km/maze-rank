import type { Rational } from "@/lib/rational";

export function formatFractionLatex(n: number, d: number): string {
  if (n < 0) return `-\\frac{${Math.abs(n)}}{${d}}`;
  return `\\frac{${n}}{${d}}`;
}

export function formatAnswerLatex(r: Rational): string {
  if (r.den === 1) return String(r.num);
  if (Math.abs(r.num) < r.den) {
    if (r.num < 0) return `-\\frac{${Math.abs(r.num)}}{${r.den}}`;
    return `\\frac{${r.num}}{${r.den}}`;
  }
  const sign = r.num < 0 ? -1 : 1;
  const absNum = Math.abs(r.num);
  const whole = Math.floor(absNum / r.den);
  const rem = absNum % r.den;
  if (rem === 0) return String(sign < 0 ? -whole : whole);
  const frac = `\\frac{${rem}}{${r.den}}`;
  if (whole === 0) return sign < 0 ? `-${frac}` : frac;
  return sign < 0 ? `-${whole}\\,${frac}` : `${whole}\\,${frac}`;
}

export function formatNumLatex(n: number): string {
  return n < 0 ? `(${n})` : String(n);
}

export function promptFractionAdd(n1: number, d1: number, n2: number, d2: number): string {
  return `${formatFractionLatex(n1, d1)} + ${formatFractionLatex(n2, d2)} = \\,?`;
}

export function promptFractionMul(n1: number, d1: number, n2: number, d2: number): string {
  return `${formatFractionLatex(n1, d1)} \\times ${formatFractionLatex(n2, d2)} = \\,?`;
}

export function promptAddSub(a: number, b: number, op: "+" | "−"): string {
  return `${formatNumLatex(a)} ${op} ${formatNumLatex(b)} = \\,?`;
}

export function promptMul(a: number, b: number): string {
  return `${formatNumLatex(a)} \\times ${formatNumLatex(b)} = \\,?`;
}

export function promptDiv(a: number, b: number): string {
  return `${formatNumLatex(a)} \\div ${formatNumLatex(b)} = \\,?`;
}

export function promptOrderOps(expr: string): string {
  return `${expr} = \\,?`;
}

export function promptEquation1(a: number, b: number): string {
  return `x + ${formatNumLatex(a)} = ${formatNumLatex(b)},\\ x = \\,?`;
}

export function promptEquation2(a: number, b: number, c: number): string {
  return `${a}x + ${formatNumLatex(b)} = ${formatNumLatex(c)},\\ x = \\,?`;
}

export function promptRectGeometry(w: number, h: number, askArea: boolean): string {
  const metric = askArea ? "area" : "perimeter";
  return `\\text{Rectangle } ${w} \\times ${h}:\\ \\text{${metric}} = \\,?`;
}

export function promptTriangleGeometry(base: number, height: number): string {
  return `\\text{Triangle base } ${base},\\ \\text{height } ${height}:\\ \\text{area} = \\,?`;
}
