import type { Quiz } from "@/lib/math-quiz";

export type MoveDir = "n" | "e" | "s" | "w";

export const QUIZ_MAX_ANGLE_DEG = 60;

export type QuizRunState = {
  cleared: Set<number>;
  active: Quiz | null;
  pendingIndex: number | null;
};

export function createQuizRunState(): QuizRunState {
  return { cleared: new Set(), active: null, pendingIndex: null };
}

export function quizCount(level: number): number {
  return level + 1;
}

export function milestoneThresholds(level: number): number[] {
  const n = quizCount(level);
  return Array.from({ length: n }, (_, i) => (i + 1) / (n + 1));
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

/** Fisher–Yates shuffle of checkpoint heights for this run (same values, random order). */
export function shuffleMilestoneThresholds(level: number, seed: number): number[] {
  const thresholds = [...milestoneThresholds(level)];
  const rng = mulberry32(seed ^ 0x9e3779b9);
  for (let i = thresholds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [thresholds[i], thresholds[j]] = [thresholds[j]!, thresholds[i]!];
  }
  return thresholds;
}

export function progressTowardGoal(row: number, rows: number): number {
  if (rows <= 1) return 1;
  return 1 - row / (rows - 1);
}

export function cellCoords(index: number, cols: number): { col: number; row: number } {
  return { col: index % cols, row: Math.floor(index / cols) };
}

export function manhattanToGoal(index: number, goal: number, cols: number): number {
  const a = cellCoords(index, cols);
  const b = cellCoords(goal, cols);
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

const MOVE_VEC: Record<MoveDir, [number, number]> = {
  n: [0, -1],
  e: [1, 0],
  s: [0, 1],
  w: [-1, 0],
};

function angleBetweenDeg(ax: number, ay: number, bx: number, by: number): number {
  const magA = Math.hypot(ax, ay);
  const magB = Math.hypot(bx, by);
  if (magA === 0 || magB === 0) return 180;
  const dot = ax * bx + ay * by;
  const cos = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function isMovingTowardGoal(
  current: number,
  next: number,
  goal: number,
  cols: number,
  dir: MoveDir,
): boolean {
  if (manhattanToGoal(next, goal, cols) >= manhattanToGoal(current, goal, cols)) {
    return false;
  }

  const nextCell = cellCoords(next, cols);
  const goalCell = cellCoords(goal, cols);
  const toGoalX = goalCell.col - nextCell.col;
  const toGoalY = goalCell.row - nextCell.row;
  const [moveX, moveY] = MOVE_VEC[dir];

  return angleBetweenDeg(moveX, moveY, toGoalX, toGoalY) <= QUIZ_MAX_ANGLE_DEG;
}

/** First uncleared milestone crossed on this move (lowest index among crossed gates). */
export function crossedMilestone(
  prevRow: number,
  nextRow: number,
  rows: number,
  cleared: Set<number>,
  thresholds: number[],
): number | null {
  const prevP = progressTowardGoal(prevRow, rows);
  const nextP = progressTowardGoal(nextRow, rows);

  for (let i = 0; i < thresholds.length; i++) {
    if (cleared.has(i)) continue;
    const t = thresholds[i]!;
    if (prevP < t && nextP >= t) return i;
  }
  return null;
}

export function allMilestonesCleared(level: number, cleared: Set<number>): boolean {
  return cleared.size >= quizCount(level);
}

export function evaluateQuizTrigger(params: {
  current: number;
  next: number;
  goal: number;
  cols: number;
  rows: number;
  level: number;
  dir: MoveDir;
  cleared: Set<number>;
  thresholds?: number[];
}): number | null {
  const { current, next, goal, cols, rows, level, dir, cleared, thresholds } = params;
  if (!isMovingTowardGoal(current, next, goal, cols, dir)) return null;

  const prevRow = cellCoords(current, cols).row;
  const nextRow = cellCoords(next, cols).row;
  const gates = thresholds ?? milestoneThresholds(level);
  return crossedMilestone(prevRow, nextRow, rows, cleared, gates);
}
