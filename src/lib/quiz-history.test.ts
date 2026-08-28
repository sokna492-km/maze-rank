import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addSeenQuizPrompt,
  clearSeenQuizPromptsForTests,
  getSeenQuizPrompts,
  hasSeenQuizPrompt,
} from "@/lib/quiz-history";

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe("quiz-history", () => {
  beforeEach(() => {
    const storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    clearSeenQuizPromptsForTests();
    vi.unstubAllGlobals();
  });

  it("starts empty", () => {
    expect(getSeenQuizPrompts().size).toBe(0);
    expect(hasSeenQuizPrompt("\\frac{1}{2} + \\frac{1}{4} = \\,?")).toBe(false);
  });

  it("persists seen prompts", () => {
    const prompt = "\\frac{5}{8} + \\frac{1}{2} = \\,?";
    addSeenQuizPrompt(prompt);
    expect(hasSeenQuizPrompt(prompt)).toBe(true);
    expect(getSeenQuizPrompts()).toEqual(new Set([prompt]));
  });

  it("dedupes on re-add", () => {
    const prompt = "2 + 3 = \\,?";
    addSeenQuizPrompt(prompt);
    addSeenQuizPrompt(prompt);
    expect(getSeenQuizPrompts().size).toBe(1);
  });

  it("accumulates multiple prompts", () => {
    addSeenQuizPrompt("a");
    addSeenQuizPrompt("b");
    addSeenQuizPrompt("c");
    expect(getSeenQuizPrompts()).toEqual(new Set(["a", "b", "c"]));
  });

  it("survives reload via localStorage", () => {
    addSeenQuizPrompt("x");
    addSeenQuizPrompt("y");
    expect(getSeenQuizPrompts()).toEqual(new Set(["x", "y"]));
  });
});
