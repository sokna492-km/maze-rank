import { RANKS, RANK_SLUGS } from "@/lib/maze";

export const MAZE_RANK_HOME = "/" as const;
export const MAZE_RANK_PLAY_ROUTE = "/live/$rank" as const;

export type RankNodeState = "done" | "current" | "locked";

export type RankNodeLayout = {
  rank: (typeof RANKS)[number];
  index: number;
  slug: string;
  position: [number, number, number];
};

export function getRankNodeState(index: number, unlocked: number): RankNodeState {
  if (index < unlocked) return "done";
  if (index === unlocked) return "current";
  return "locked";
}

export function getRankNodePositions(count = RANKS.length): RankNodeLayout[] {
  return RANKS.map((rank, i) => {
    const x = i % 2 === 0 ? -2.2 : 2.2;
    const y = 4.5 - (i * 9) / (count - 1);
    return {
      rank,
      index: i,
      slug: RANK_SLUGS[i]!,
      position: [x, y, 0],
    };
  });
}

export function getProgressFraction(unlocked: number, count = RANKS.length): number {
  return (Math.min(unlocked, count - 1) + 0.001) / (count - 1);
}

/** Resolve a CSS custom property to a browser-computed rgb color string. */
export function getCssColor(cssVar: string): string {
  if (typeof document === "undefined") return "#888888";
  const probe = document.createElement("span");
  probe.style.color = `var(${cssVar})`;
  probe.style.display = "none";
  document.documentElement.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color || "#888888";
}

export function getRankColor(index: number): string {
  return getCssColor(`--rank-${index + 1}`);
}

export function getThemeColors() {
  return {
    primary: getCssColor("--primary"),
    border: getCssColor("--border"),
    background: getCssColor("--background"),
  };
}
