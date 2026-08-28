export type Rational = { num: number; den: number };

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function rational(num: number, den: number): Rational {
  if (den === 0) throw new Error("Division by zero");
  const g = gcd(num, den);
  let n = num / g;
  let d = den / g;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  return { num: n, den: d };
}

export function fromInt(n: number): Rational {
  return rational(n, 1);
}

export function add(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den + b.num * a.den, a.den * b.den);
}

export function sub(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den - b.num * a.den, a.den * b.den);
}

export function mul(a: Rational, b: Rational): Rational {
  return rational(a.num * b.num, a.den * b.den);
}

export function div(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den, a.den * b.num);
}

export function equals(a: Rational, b: Rational): boolean {
  return a.num * b.den === b.num * a.den;
}

export function isWhole(r: Rational): boolean {
  return r.den === 1;
}

export function isProper(r: Rational): boolean {
  return Math.abs(r.num) < r.den;
}

export function formatAnswerPlain(r: Rational): string {
  if (r.den === 1) return String(r.num);
  if (Math.abs(r.num) < r.den) {
    return `${r.num}/${r.den}`;
  }
  const sign = r.num < 0 ? -1 : 1;
  const absNum = Math.abs(r.num);
  const whole = Math.floor(absNum / r.den);
  const rem = absNum % r.den;
  if (rem === 0) return String(sign < 0 ? -whole : whole);
  const fracPart = `${rem}/${r.den}`;
  if (whole === 0) return sign < 0 ? `-${fracPart}` : fracPart;
  return sign < 0 ? `-${whole} ${fracPart}` : `${whole} ${fracPart}`;
}

export function parseFormatted(s: string): Rational | null {
  const trimmed = s.trim();
  const mixed = /^(-?\d+)\s+(\d+)\/(\d+)$/.exec(trimmed);
  if (mixed) {
    const whole = parseInt(mixed[1]!, 10);
    const n = parseInt(mixed[2]!, 10);
    const d = parseInt(mixed[3]!, 10);
    const sign = whole < 0 ? -1 : 1;
    return rational(sign * (Math.abs(whole) * d + n), d);
  }
  const frac = /^(-?\d+)\/(\d+)$/.exec(trimmed);
  if (frac) return rational(parseInt(frac[1]!, 10), parseInt(frac[2]!, 10));
  if (/^-?\d+$/.test(trimmed)) return fromInt(parseInt(trimmed, 10));
  return null;
}
