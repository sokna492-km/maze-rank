import { describe, expect, it } from "vitest";
import {
  add,
  div,
  equals,
  formatAnswerPlain,
  fromInt,
  mul,
  parseFormatted,
  rational,
  sub,
} from "@/lib/rational";

describe("rational", () => {
  it("normalizes and simplifies", () => {
    expect(rational(18, 16)).toEqual({ num: 9, den: 8 });
    expect(rational(-2, 4)).toEqual({ num: -1, den: 2 });
  });

  it("adds fractions exactly", () => {
    expect(formatAnswerPlain(add(rational(5, 8), rational(1, 2)))).toBe("1 1/8");
    expect(formatAnswerPlain(add(rational(1, 2), rational(1, 4)))).toBe("3/4");
    expect(formatAnswerPlain(add(rational(1, 2), rational(1, 2)))).toBe("1");
  });

  it("subtracts fractions exactly", () => {
    expect(formatAnswerPlain(sub(rational(3, 4), rational(1, 2)))).toBe("1/4");
  });

  it("multiplies fractions exactly", () => {
    expect(formatAnswerPlain(mul(rational(2, 3), rational(3, 4)))).toBe("1/2");
  });

  it("divides fractions exactly", () => {
    expect(formatAnswerPlain(div(rational(3, 4), rational(1, 2)))).toBe("1 1/2");
  });

  it("formats mixed numbers for improper fractions", () => {
    expect(formatAnswerPlain(rational(18, 16))).toBe("1 1/8");
    expect(formatAnswerPlain(rational(9, 8))).toBe("1 1/8");
  });

  it("handles zero", () => {
    expect(formatAnswerPlain(fromInt(0))).toBe("0");
    expect(formatAnswerPlain(rational(0, 5))).toBe("0");
  });

  it("handles negatives", () => {
    expect(formatAnswerPlain(add(rational(-3, 4), rational(1, 2)))).toBe("-1/4");
    expect(formatAnswerPlain(mul(rational(-2, 3), rational(3, 4)))).toBe("-1/2");
  });

  it("parses formatted strings", () => {
    expect(parseFormatted("1 1/8")).toEqual(rational(9, 8));
    expect(parseFormatted("3/4")).toEqual(rational(3, 4));
    expect(parseFormatted("2")).toEqual(fromInt(2));
    expect(parseFormatted("-1 1/2")).toEqual(rational(-3, 2));
  });

  it("equals cross-multiplies", () => {
    expect(equals(rational(1, 2), rational(2, 4))).toBe(true);
    expect(equals(rational(9, 8), rational(18, 16))).toBe(true);
  });
});
