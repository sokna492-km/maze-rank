const NAME_KEY = "neon-maze-name";
const TIMES_KEY = "neon-maze-times";

export type Entry = { name: string; seconds: number; you?: boolean };

/** Seeded rivals so the board always feels populated. */
const RIVALS: Entry[] = [
  { name: "Vireak", seconds: 412 },
  { name: "Sokha", seconds: 458 },
  { name: "Dara", seconds: 496 },
  { name: "Nita", seconds: 531 },
  { name: "Rathana", seconds: 574 },
  { name: "Chanda", seconds: 615 },
  { name: "Piseth", seconds: 668 },
  { name: "Malis", seconds: 702 },
  { name: "Kosal", seconds: 745 },
  { name: "Bopha", seconds: 803 },
  { name: "Samnang", seconds: 861 },
  { name: "Leakhena", seconds: 924 },
];

export function getName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 16));
}

/** Best seconds per level index. */
export function getTimes(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(TIMES_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export function recordTime(level: number, seconds: number) {
  if (typeof window === "undefined") return;
  const times = getTimes();
  const prev = times[String(level)];
  if (prev === undefined || seconds < prev) times[String(level)] = seconds;
  window.localStorage.setItem(TIMES_KEY, JSON.stringify(times));
}

export function totalSeconds(): number {
  return Object.values(getTimes()).reduce((a, b) => a + b, 0);
}

export function leaderboard(): Entry[] {
  const total = totalSeconds();
  const name = getName() || "You";
  const list = [...RIVALS];
  if (total > 0) list.push({ name, seconds: total, you: true });
  return list.sort((a, b) => a.seconds - b.seconds);
}

export function fmt(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}
