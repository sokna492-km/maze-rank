import { describe, expect, it } from "vitest";
import { formatAnswerLatex, promptFractionAdd } from "@/lib/math-latex";
import { formatAnswerPlain, rational } from "@/lib/rational";
import {
  buildFractionAddQuiz,
  evaluateFractionAdd,
  evaluateFractionDiv,
  evaluateFractionMul,
  evaluateFractionSub,
  generateQuiz,
  generateUniqueQuiz,
  quizPromptKey,
  validateQuiz,
} from "@/lib/math-quiz";

describe("math-quiz fraction correctness", () => {
  it("5/8 + 1/2 = 1 1/8", () => {
    const answer = evaluateFractionAdd(5, 8, 1, 2);
    expect(formatAnswerPlain(answer)).toBe("1 1/8");
    expect(formatAnswerLatex(answer)).toBe("1\\,\\frac{1}{8}");
  });

  it("1/2 + 1/4 = 3/4", () => {
    expect(formatAnswerPlain(evaluateFractionAdd(1, 2, 1, 4))).toBe("3/4");
  });

  it("3/4 - 1/2 = 1/4", () => {
    expect(formatAnswerPlain(evaluateFractionSub(3, 4, 1, 2))).toBe("1/4");
  });

  it("2/3 × 3/4 = 1/2", () => {
    expect(formatAnswerPlain(evaluateFractionMul(2, 3, 3, 4))).toBe("1/2");
  });

  it("3/4 ÷ 1/2 = 1 1/2", () => {
    expect(formatAnswerPlain(evaluateFractionDiv(3, 4, 1, 2))).toBe("1 1/2");
  });

  it("18/16 reduces to 1 1/8", () => {
    expect(formatAnswerPlain(rational(18, 16))).toBe("1 1/8");
  });

  it("1/2 + 1/2 = 1", () => {
    expect(formatAnswerPlain(evaluateFractionAdd(1, 2, 1, 2))).toBe("1");
  });

  it("negative fraction add", () => {
    expect(formatAnswerPlain(evaluateFractionAdd(-3, 4, 1, 2))).toBe("-1/4");
  });
});

describe("math-quiz LaTeX output", () => {
  it("renders 5/8 + 1/2 prompt and correct choice as LaTeX", () => {
    const quiz = buildFractionAddQuiz(5, 8, 1, 2);
    expect(quiz.prompt).toBe(promptFractionAdd(5, 8, 1, 2));
    expect(quiz.prompt).toContain("\\frac{5}{8}");
    expect(quiz.prompt).toContain("\\frac{1}{2}");
    expect(quiz.choices[quiz.correctIndex]).toBe("1\\,\\frac{1}{8}");
  });

  it("all choices are LaTeX strings for fraction quiz", () => {
    const quiz = buildFractionAddQuiz(5, 8, 1, 2);
    for (const choice of quiz.choices) {
      expect(choice.length).toBeGreaterThan(0);
      expect(validateQuiz(quiz)).toBe(true);
    }
  });
});

describe("math-quiz unique generation", () => {
  it("variation changes output for the same milestone", () => {
    const base = generateQuiz(42, 3, 0, 0);
    const varied = generateQuiz(42, 3, 0, 1);
    expect(varied.prompt).not.toBe(base.prompt);
  });

  it("generateUniqueQuiz excludes used prompts", () => {
    const first = generateQuiz(7, 2, 0);
    const used = new Set([quizPromptKey(first)]);
    const next = generateUniqueQuiz(7, 2, 0, used);
    expect(used.has(quizPromptKey(next))).toBe(false);
  });

  it("generateUniqueQuiz returns different prompts on repeated calls", () => {
    const used = new Set<string>();
    const prompts = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const quiz = generateUniqueQuiz(99, 4, 0, used);
      const key = quizPromptKey(quiz);
      expect(used.has(key)).toBe(false);
      used.add(key);
      prompts.add(key);
    }
    expect(prompts.size).toBe(8);
  });

  it("generateUniqueQuiz never returns a prompt from a large exclusion set", () => {
    const used = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const quiz = generateQuiz(i * 31 + 5, (i % 7) + 1, i % 4, i);
      used.add(quizPromptKey(quiz));
    }

    for (let i = 0; i < 20; i++) {
      const quiz = generateUniqueQuiz(500 + i, 5, i % 3, used);
      expect(used.has(quizPromptKey(quiz))).toBe(false);
      used.add(quizPromptKey(quiz));
    }
  });
});

describe("math-quiz property audit", () => {
  it("validates 1000 generated quizzes", () => {
    let fractionCount = 0;
    for (let i = 0; i < 1000; i++) {
      const quiz = generateQuiz(i * 17 + 3, (i % 9) + 1, i % 5);
      expect(validateQuiz(quiz)).toBe(true);
      expect(quiz.choices).toHaveLength(4);
      expect(new Set(quiz.choices).size).toBe(4);

      if (quiz.kind === "fraction_add" || quiz.kind === "fraction_mul") {
        fractionCount++;
        const correct = quiz.choices[quiz.correctIndex]!;
        const hasFrac =
          correct.includes("\\frac") || correct.includes("\\,\\frac");
        expect(hasFrac || correct.match(/^-?\d+$/)).toBeTruthy();
      }
    }
    expect(fractionCount).toBeGreaterThan(0);
  });

  it("never stores bare numerator as fraction answer", () => {
    for (let i = 0; i < 500; i++) {
      const quiz = generateQuiz(i, 3, 0);
      if (quiz.kind !== "fraction_add") continue;
      expect(formatAnswerPlain(quiz.answer)).not.toBe("9");
      if (quiz.prompt.includes("\\frac{5}{8}") && quiz.prompt.includes("\\frac{1}{2}")) {
        expect(quiz.choices[quiz.correctIndex]).toBe("1\\,\\frac{1}{8}");
      }
    }
  });
});
