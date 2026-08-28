import {
  formatAnswerLatex,
  promptAddSub,
  promptDiv,
  promptEquation1,
  promptEquation2,
  promptFractionAdd,
  promptFractionMul,
  promptMul,
  promptOrderOps,
  promptRectGeometry,
  promptTriangleGeometry,
} from "@/lib/math-latex";
import {
  add,
  div,
  equals,
  fromInt,
  mul,
  rational,
  sub,
  type Rational,
} from "@/lib/rational";

export type QuizKind =
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "fraction_add"
  | "fraction_mul"
  | "order_ops"
  | "equation_1"
  | "equation_2"
  | "pemdas"
  | "geometry_rect"
  | "geometry_triangle";

export type Quiz = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  kind: QuizKind;
  answer: Rational;
};

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function signedOperand(rng: () => number, useNegative: boolean, min: number, max: number): number {
  const n = randInt(rng, min, max);
  if (!useNegative) return n;
  return rng() < 0.5 ? -n : n;
}

const DENOMS = [2, 3, 4, 5, 6, 8, 10];

function useFractionDistractors(correct: Rational, kind: QuizKind): boolean {
  if (kind === "fraction_add" || kind === "fraction_mul") return true;
  return correct.den !== 1;
}

function fractionDistractors(rng: () => number, correct: Rational): Rational[] {
  const candidates: Rational[] = [
    rational(correct.num + 1, correct.den),
    rational(correct.num - 1, correct.den),
    rational(correct.num + 2, correct.den),
    rational(correct.num - 2, correct.den),
    rational(correct.num, correct.den + 1),
    rational(correct.num + 1, correct.den + 2),
    rational(-correct.num, correct.den),
    rational(correct.num + correct.den, correct.den),
    rational(correct.num - correct.den, correct.den),
  ];

  const whole = Math.floor(Math.abs(correct.num) / correct.den);
  if (whole > 0) {
    candidates.push(rational(whole, correct.den));
    candidates.push(fromInt(whole));
  }

  const out: Rational[] = [];
  for (const c of shuffle(rng, candidates)) {
    if (!equals(c, correct) && !out.some((d) => equals(d, c))) out.push(c);
    if (out.length >= 3) break;
  }

  let guard = 0;
  while (out.length < 3 && guard++ < 40) {
    const offset = pick(rng, [1, -1, 2, -2, 3, -3]);
    const approx = Math.round(correct.num / correct.den) + offset;
    const w = fromInt(approx);
    if (!equals(w, correct) && !out.some((d) => equals(d, w))) out.push(w);
  }

  return out;
}

function integerDistractors(rng: () => number, correct: Rational): Rational[] {
  const correctVal = correct.num;
  const offsets = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10];
  const out: Rational[] = [];
  let guard = 0;
  while (out.length < 3 && guard++ < 40) {
    const offset = pick(rng, offsets);
    const wrong = fromInt(correctVal + offset);
    if (!equals(wrong, correct) && !out.some((d) => equals(d, wrong))) out.push(wrong);
  }
  return out;
}

function buildChoices(
  rng: () => number,
  correct: Rational,
  kind: QuizKind,
): { choices: string[]; correctIndex: number } {
  const distractorRationals = useFractionDistractors(correct, kind)
    ? fractionDistractors(rng, correct)
    : integerDistractors(rng, correct);

  const choiceRationals = shuffle(rng, [correct, ...distractorRationals.slice(0, 3)]);
  const choices = choiceRationals.map(formatAnswerLatex);
  const correctLatex = formatAnswerLatex(correct);
  const correctIndex = choices.indexOf(correctLatex);

  return { choices, correctIndex };
}

type GenResult = { prompt: string; answer: Rational; kind: QuizKind };

function genAddSub(rng: () => number, useNegative: boolean, maxVal: number): GenResult {
  const op = rng() < 0.5 ? "+" : "−";
  const a = signedOperand(rng, useNegative, 1, maxVal);
  const b = signedOperand(rng, useNegative, 1, maxVal);
  if (op === "+") {
    return {
      prompt: promptAddSub(a, b, "+"),
      answer: fromInt(a + b),
      kind: "add",
    };
  }
  return {
    prompt: promptAddSub(a, b, "−"),
    answer: fromInt(a - b),
    kind: "sub",
  };
}

function genMul(rng: () => number, useNegative: boolean, maxVal: number): GenResult {
  const a = signedOperand(rng, useNegative, 2, maxVal);
  const b = signedOperand(rng, useNegative, 2, Math.min(12, maxVal));
  return {
    prompt: promptMul(a, b),
    answer: fromInt(a * b),
    kind: "mul",
  };
}

function genDiv(rng: () => number, useNegative: boolean, maxVal: number): GenResult {
  const b = signedOperand(rng, useNegative, 2, Math.min(12, maxVal));
  if (b === 0) return genDiv(rng, useNegative, maxVal);
  const q = signedOperand(rng, useNegative, 2, maxVal);
  const a = b * q;
  return {
    prompt: promptDiv(a, b),
    answer: fromInt(q),
    kind: "div",
  };
}

function genFractionAdd(rng: () => number): GenResult {
  const d1 = pick(rng, DENOMS);
  const d2 = pick(rng, DENOMS);
  const n1 = randInt(rng, 1, d1 - 1);
  const n2 = randInt(rng, 1, d2 - 1);
  return {
    prompt: promptFractionAdd(n1, d1, n2, d2),
    answer: add(rational(n1, d1), rational(n2, d2)),
    kind: "fraction_add",
  };
}

function genFractionMul(rng: () => number, useNegative: boolean): GenResult {
  const d1 = pick(rng, DENOMS);
  const d2 = pick(rng, DENOMS);
  let n1 = randInt(rng, 1, d1 - 1);
  const n2 = randInt(rng, 1, d2 - 1);
  if (useNegative && rng() < 0.5) n1 = -n1;
  return {
    prompt: promptFractionMul(n1, d1, n2, d2),
    answer: mul(rational(n1, d1), rational(n2, d2)),
    kind: "fraction_mul",
  };
}

function genOrderOps(rng: () => number, useNegative: boolean, terms: number): GenResult {
  const a = signedOperand(rng, useNegative, 2, 9);
  const b = signedOperand(rng, useNegative, 2, 9);
  const c = signedOperand(rng, useNegative, 2, 9);
  if (terms === 3) {
    const mulFirst = rng() < 0.5;
    if (mulFirst) {
      return {
        prompt: promptOrderOps(`${formatNumForPrompt(a)} + ${formatNumForPrompt(b)} \\times ${formatNumForPrompt(c)}`),
        answer: fromInt(a + b * c),
        kind: "order_ops",
      };
    }
    return {
      prompt: promptOrderOps(`${formatNumForPrompt(a)} \\times ${formatNumForPrompt(b)} + ${formatNumForPrompt(c)}`),
      answer: fromInt(a * b + c),
      kind: "order_ops",
    };
  }
  const d = signedOperand(rng, useNegative, 2, 6);
  return {
    prompt: promptOrderOps(
      `${formatNumForPrompt(a)} + ${formatNumForPrompt(b)} \\times ${formatNumForPrompt(c)} − ${formatNumForPrompt(d)}`,
    ),
    answer: fromInt(a + b * c - d),
    kind: "pemdas",
  };
}

function formatNumForPrompt(n: number): string {
  return n < 0 ? `(${n})` : String(n);
}

function genEquation1(rng: () => number, useNegative: boolean): GenResult {
  const x = signedOperand(rng, useNegative, 1, 15);
  const a = signedOperand(rng, useNegative, 1, 20);
  const b = x + a;
  return {
    prompt: promptEquation1(a, b),
    answer: fromInt(x),
    kind: "equation_1",
  };
}

function genEquation2(rng: () => number, useNegative: boolean): GenResult {
  const x = signedOperand(rng, useNegative, 1, 12);
  const a = randInt(rng, 2, 9);
  const b = signedOperand(rng, useNegative, 1, 20);
  const c = a * x + b;
  return {
    prompt: promptEquation2(a, b, c),
    answer: fromInt(x),
    kind: "equation_2",
  };
}

function genRectGeometry(rng: () => number): GenResult {
  const w = randInt(rng, 3, 15);
  const h = randInt(rng, 3, 15);
  const askArea = rng() < 0.5;
  if (askArea) {
    return {
      prompt: promptRectGeometry(w, h, true),
      answer: fromInt(w * h),
      kind: "geometry_rect",
    };
  }
  return {
    prompt: promptRectGeometry(w, h, false),
    answer: fromInt(2 * (w + h)),
    kind: "geometry_rect",
  };
}

function genTriangleGeometry(rng: () => number): GenResult {
  const base = randInt(rng, 4, 16);
  const height = randInt(rng, 3, 12);
  return {
    prompt: promptTriangleGeometry(base, height),
    answer: rational(base * height, 2),
    kind: "geometry_triangle",
  };
}

type Generator = (rng: () => number, useNegative: boolean) => GenResult;

function generatorsForLevel(level: number): Generator[] {
  if (level <= 1) {
    return [(r, u) => genAddSub(r, u, 20), (r, u) => genMul(r, u, 10)];
  }
  if (level <= 3) {
    return [
      (r, u) => genAddSub(r, u, 50),
      (r, u) => genMul(r, u, 12),
      (r, u) => genDiv(r, u, 12),
      (r) => genFractionAdd(r),
    ];
  }
  if (level <= 5) {
    return [
      (r, u) => genOrderOps(r, u, 3),
      (r, u) => genEquation1(r, u),
      (r, u) => genAddSub(r, u, 50),
      (r, u) => genMul(r, u, 12),
    ];
  }
  if (level <= 7) {
    return [
      (r, u) => genEquation2(r, u),
      (r, u) => genOrderOps(r, u, 3),
      (r, u) => genFractionMul(r, u),
      (r, u) => genDiv(r, u, 15),
    ];
  }
  return [
    (r, u) => genOrderOps(r, u, 4),
    (r, u) => genEquation2(r, u),
    (r, u) => genFractionMul(r, u),
    (r) => genRectGeometry(r),
    (r) => genTriangleGeometry(r),
  ];
}

export function evaluateFractionAdd(n1: number, d1: number, n2: number, d2: number): Rational {
  return add(rational(n1, d1), rational(n2, d2));
}

export function evaluateFractionMul(n1: number, d1: number, n2: number, d2: number): Rational {
  return mul(rational(n1, d1), rational(n2, d2));
}

export function evaluateFractionSub(n1: number, d1: number, n2: number, d2: number): Rational {
  return sub(rational(n1, d1), rational(n2, d2));
}

export function evaluateFractionDiv(n1: number, d1: number, n2: number, d2: number): Rational {
  return div(rational(n1, d1), rational(n2, d2));
}

export function validateQuiz(quiz: Quiz): boolean {
  if (quiz.choices.length !== 4) return false;
  if (quiz.correctIndex < 0 || quiz.correctIndex >= 4) return false;
  if (new Set(quiz.choices).size !== 4) return false;

  const correctLatex = formatAnswerLatex(quiz.answer);
  if (quiz.choices[quiz.correctIndex] !== correctLatex) return false;

  const matchCount = quiz.choices.filter((c) => c === correctLatex).length;
  return matchCount === 1;
}

export function quizSeed(mazeSeed: number, level: number, milestoneIndex: number): number {
  return mazeSeed * 1000 + milestoneIndex * 97 + level * 13;
}

export function quizPromptKey(quiz: Quiz): string {
  return quiz.prompt;
}

function assembleQuiz(
  id: string,
  prompt: string,
  answer: Rational,
  kind: QuizKind,
  rng: () => number,
): Quiz | null {
  const { choices, correctIndex } = buildChoices(rng, answer, kind);
  if (correctIndex < 0) return null;

  const quiz: Quiz = { id, prompt, choices, correctIndex, kind, answer };
  return validateQuiz(quiz) ? quiz : null;
}

export function generateQuiz(
  mazeSeed: number,
  level: number,
  milestoneIndex: number,
  variation = 0,
): Quiz {
  const seed = quizSeed(mazeSeed, level, milestoneIndex) + variation * 7919;
  const rng = mulberry32(seed);
  const useNegative = rng() < 0.5;
  const gens = generatorsForLevel(level);

  for (let attempt = 0; attempt < 12; attempt++) {
    const gen = pick(rng, gens);
    const { prompt, answer, kind } = gen(rng, useNegative);
    const quiz = assembleQuiz(`${seed}-${attempt}`, prompt, answer, kind, rng);
    if (quiz) return quiz;
  }

  const fallback = genAddSub(mulberry32(seed + 1), useNegative, 20);
  const fallbackQuiz = assembleQuiz(
    `${seed}-fb`,
    fallback.prompt,
    fallback.answer,
    fallback.kind,
    mulberry32(seed + 2),
  );
  if (fallbackQuiz) return fallbackQuiz;

  const { choices, correctIndex } = buildChoices(mulberry32(seed + 3), fallback.answer, fallback.kind);
  return {
    id: `${seed}-fb2`,
    prompt: fallback.prompt,
    choices,
    correctIndex,
    kind: fallback.kind,
    answer: fallback.answer,
  };
}

export function generateUniqueQuiz(
  mazeSeed: number,
  level: number,
  milestoneIndex: number,
  usedPrompts: ReadonlySet<string>,
  maxAttempts = 256,
): Quiz {
  for (let variation = 0; variation < maxAttempts; variation++) {
    const quiz = generateQuiz(mazeSeed, level, milestoneIndex, variation);
    if (!usedPrompts.has(quizPromptKey(quiz))) return quiz;
  }

  for (let i = 0; i < 256; i++) {
    const variation = maxAttempts + i + Math.floor(Math.random() * 1_000_000);
    const quiz = generateQuiz(mazeSeed, level, milestoneIndex, variation);
    if (!usedPrompts.has(quizPromptKey(quiz))) return quiz;
  }

  throw new Error("Could not generate a unique quiz prompt");
}

/** Build a quiz from fixed operands (for tests). */
export function buildFractionAddQuiz(n1: number, d1: number, n2: number, d2: number): Quiz {
  const answer = evaluateFractionAdd(n1, d1, n2, d2);
  const prompt = promptFractionAdd(n1, d1, n2, d2);
  const rng = mulberry32(42);
  const quiz = assembleQuiz("test-fraction-add", prompt, answer, "fraction_add", rng);
  if (!quiz) throw new Error("Failed to build fraction add quiz");
  return quiz;
}
