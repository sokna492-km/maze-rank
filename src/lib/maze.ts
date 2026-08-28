export type Cell = { n: boolean; e: boolean; s: boolean; w: boolean };
export type Maze = { cols: number; rows: number; cells: Cell[] };

export const RANKS = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
] as const;

export type Rank = (typeof RANKS)[number];

export const RANK_SLUGS = RANKS.map((r) => r.toLowerCase().replace(/\s+/g, "-"));

export function rankIndexFromSlug(slug: string) {
  return RANK_SLUGS.indexOf(slug);
}

/** Grid size grows with rank difficulty. */
export function sizeForLevel(level: number) {
  const cols = 7 + level * 2;
  const rows = 9 + level * 2;
  return { cols, rows };
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateMaze(cols: number, rows: number, seed: number): Maze {
  const cells: Cell[] = Array.from({ length: cols * rows }, () => ({
    n: true,
    e: true,
    s: true,
    w: true,
  }));
  const rand = mulberry32(seed);
  const visited = new Array(cols * rows).fill(false);
  const stack: number[] = [0];
  visited[0] = true;

  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const x = cur % cols;
    const y = Math.floor(cur / cols);
    const neighbors: Array<[number, keyof Cell, keyof Cell]> = [];
    if (y > 0 && !visited[cur - cols]) neighbors.push([cur - cols, "n", "s"]);
    if (x < cols - 1 && !visited[cur + 1]) neighbors.push([cur + 1, "e", "w"]);
    if (y < rows - 1 && !visited[cur + cols]) neighbors.push([cur + cols, "s", "n"]);
    if (x > 0 && !visited[cur - 1]) neighbors.push([cur - 1, "w", "e"]);

    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const [next, wall, opposite] = neighbors[Math.floor(rand() * neighbors.length)]!;
    cells[cur]![wall] = false;
    cells[next]![opposite] = false;
    visited[next] = true;
    stack.push(next);
  }

  return { cols, rows, cells };
}

export function canMove(maze: Maze, index: number, dir: "n" | "e" | "s" | "w") {
  const cell = maze.cells[index]!;
  if (cell[dir]) return null;
  if (dir === "n") return index - maze.cols;
  if (dir === "s") return index + maze.cols;
  if (dir === "e") return index + 1;
  return index - 1;
}
