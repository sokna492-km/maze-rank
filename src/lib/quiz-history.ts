const KEY = "neon-maze-seen-quizzes";

function readPrompts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function writePrompts(prompts: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(prompts));
}

export function getSeenQuizPrompts(): Set<string> {
  return new Set(readPrompts());
}

export function hasSeenQuizPrompt(prompt: string): boolean {
  return getSeenQuizPrompts().has(prompt);
}

export function addSeenQuizPrompt(prompt: string): void {
  if (typeof window === "undefined") return;
  const prompts = readPrompts();
  if (prompts.includes(prompt)) return;
  writePrompts([...prompts, prompt]);
}

/** Test-only helper to reset persisted history. */
export function clearSeenQuizPromptsForTests(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
