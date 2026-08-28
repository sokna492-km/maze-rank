const KEY = "neon-maze-progress";

/** Highest unlocked level index (0 = Warrior). */
export function getUnlocked(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function unlockNext(level: number) {
  if (typeof window === "undefined") return;
  const next = Math.max(getUnlocked(), level + 1);
  window.localStorage.setItem(KEY, String(next));
}
