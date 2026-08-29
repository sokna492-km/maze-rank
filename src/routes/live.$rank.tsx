import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  RANKS,
  RANK_SLUGS,
  canMove,
  generateMaze,
  rankIndexFromSlug,
  sizeForLevel,
} from "@/lib/maze";
import { unlockNext } from "@/lib/progress";
import { recordTime } from "@/lib/leaderboard";
import { generateUniqueQuiz, quizPromptKey } from "@/lib/math-quiz";
import { addSeenQuizPrompt, getSeenQuizPrompts } from "@/lib/quiz-history";
import {
  allMilestonesCleared,
  evaluateQuizTrigger,
  shuffleMilestoneThresholds,
  type MoveDir,
} from "@/lib/quiz-triggers";
import { MAZE_RANK_HOME, MAZE_RANK_PLAY_ROUTE } from "@/lib/rank-path";
import { requirePlayableUser } from "@/lib/requirePlayableUser";
import { RankBadge } from "@/components/rank-icons/RankBadge";
import { QuizModal } from "@/components/QuizModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useShortViewport } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/lib/math-quiz";

export const Route = createFileRoute("/live/$rank")({
  beforeLoad: async ({ location }) => {
    await requirePlayableUser(location.pathname);
  },
  head: ({ params }) => {
    const idx = rankIndexFromSlug(params.rank);
    const name = idx >= 0 ? RANKS[idx]! : "Maze";
    return {
      meta: [
        { title: `${name} — Neon Maze` },
        {
          name: "description",
          content: `Solve the ${name} neon labyrinth and unlock the next rank.`,
        },
        { property: "og:title", content: `${name} — Neon Maze` },
        { property: "og:description", content: `Solve the ${name} neon labyrinth.` },
      ],
    };
  },
  component: Play,
});

type Dir = MoveDir;

function Play() {
  const { rank } = Route.useParams();
  const navigate = useNavigate();
  const shortViewport = useShortViewport();
  const slugIndex = rankIndexFromSlug(rank);
  const level = Math.max(0, slugIndex);
  const name = RANKS[level]!;
  const color = `var(--rank-${level + 1})`;

  const [attempt, setAttempt] = useState(0);
  const { cols, rows } = useMemo(() => sizeForLevel(level), [level]);
  const mazeSeed = (level + 1) * 7919 + attempt * 104729;
  const maze = useMemo(() => generateMaze(cols, rows, mazeSeed), [cols, rows, mazeSeed]);

  const start = (rows - 1) * cols + Math.floor(cols / 2);
  const goal = Math.floor(cols / 2);

  const [pos, setPos] = useState(start);
  const [trail, setTrail] = useState<number[]>([start]);
  const [won, setWon] = useState(false);
  const [showWinPanel, setShowWinPanel] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clearedMilestones, setClearedMilestones] = useState<number[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [pendingMilestone, setPendingMilestone] = useState<number | null>(null);
  const [usedQuizPrompts, setUsedQuizPrompts] = useState<Set<string>>(() => getSeenQuizPrompts());
  const secondsRef = useRef(0);
  const winTimeRef = useRef(0);
  const posRef = useRef(start);
  const usedQuizPromptsRef = useRef(getSeenQuizPrompts());
  const shuffledThresholdsRef = useRef<number[]>([]);
  const quizDrawRef = useRef(0);

  const quizActive = activeQuiz !== null;
  const clearedSet = useMemo(() => new Set(clearedMilestones), [clearedMilestones]);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    usedQuizPromptsRef.current = usedQuizPrompts;
  }, [usedQuizPrompts]);

  useEffect(() => {
    setPos(start);
    setTrail([start]);
    setWon(false);
    setShowWinPanel(false);
    setSeconds(0);
    winTimeRef.current = 0;
    setClearedMilestones([]);
    setActiveQuiz(null);
    setPendingMilestone(null);
    shuffledThresholdsRef.current = shuffleMilestoneThresholds(level, mazeSeed);
    quizDrawRef.current = 0;
    posRef.current = start;
  }, [start, attempt, level, mazeSeed]);

  useEffect(() => {
    if (!won) return;
    recordTime(level, winTimeRef.current);
    const panelTimer = window.setTimeout(() => setShowWinPanel(true), 520);
    return () => window.clearTimeout(panelTimer);
  }, [won, level]);

  useEffect(() => {
    if (won || quizActive) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [won, attempt, level, quizActive]);

  const handleQuizAnswer = useCallback(
    (choiceIndex: number) => {
      if (!activeQuiz || pendingMilestone === null) return;

      if (choiceIndex === activeQuiz.correctIndex) {
        setClearedMilestones((prev) =>
          prev.includes(pendingMilestone) ? prev : [...prev, pendingMilestone],
        );
        setActiveQuiz(null);
        setPendingMilestone(null);
        return;
      }

      setPos(start);
      setTrail([start]);
      posRef.current = start;
      setClearedMilestones([]);
      setActiveQuiz(null);
      setPendingMilestone(null);
    },
    [activeQuiz, pendingMilestone, start],
  );

  const move = useCallback(
    (dir: Dir) => {
      if (won || quizActive) return;

      const current = posRef.current;
      const next = canMove(maze, current, dir);
      if (next === null) return;

      const milestone = evaluateQuizTrigger({
        current,
        next,
        goal,
        cols,
        rows,
        level,
        dir,
        cleared: clearedSet,
        thresholds: shuffledThresholdsRef.current,
      });

      if (milestone !== null) {
        setTrail((t) => (t[t.length - 2] === next ? t.slice(0, -1) : [...t, next]));
        setPos(next);
        posRef.current = next;
        const drawSlot = quizDrawRef.current;
        quizDrawRef.current += 1;
        const quiz = generateUniqueQuiz(mazeSeed, level, drawSlot, usedQuizPromptsRef.current);
        addSeenQuizPrompt(quizPromptKey(quiz));
        const nextUsed = new Set(usedQuizPromptsRef.current).add(quizPromptKey(quiz));
        usedQuizPromptsRef.current = nextUsed;
        setUsedQuizPrompts(nextUsed);
        setActiveQuiz(quiz);
        setPendingMilestone(milestone);
        return;
      }

      if (next === goal && !allMilestonesCleared(level, clearedSet)) return;

      setTrail((t) => (t[t.length - 2] === next ? t.slice(0, -1) : [...t, next]));

      if (next === goal) {
        setPos(next);
        posRef.current = next;
        winTimeRef.current = secondsRef.current;
        setWon(true);
        unlockNext(level);
        return;
      }

      setPos(next);
      posRef.current = next;
    },
    [maze, goal, cols, rows, level, won, quizActive, clearedSet, mazeSeed],
  );

  useEffect(() => {
    const keys: Record<string, Dir> = {
      ArrowUp: "n",
      ArrowDown: "s",
      ArrowLeft: "w",
      ArrowRight: "e",
      w: "n",
      s: "s",
      a: "w",
      d: "e",
      W: "n",
      S: "s",
      A: "w",
      D: "e",
    };
    const onKey = (e: KeyboardEvent) => {
      if (quizActive) return;
      const dir = keys[e.key];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [move, quizActive]);

  // Swipe controls
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]!;
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current || quizActive) return;
    const t = e.touches[0]!;
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    const threshold = 22;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "e" : "w") : dy > 0 ? "s" : "n");
    touch.current = { x: t.clientX, y: t.clientY };
  };

  const nextRank = RANKS[level + 1];
  const nextSlug = RANK_SLUGS[level + 1];

  const cx = (i: number) => (i % cols) + 0.5;
  const cy = (i: number) => Math.floor(i / cols) + 0.5;
  const goalX = cx(goal);
  const goalY = cy(goal);

  const walls: string[] = [];
  for (let i = 0; i < maze.cells.length; i++) {
    const c = maze.cells[i]!;
    const x = i % cols;
    const y = Math.floor(i / cols);
    if (c.n) walls.push(`M${x} ${y}H${x + 1}`);
    if (c.w) walls.push(`M${x} ${y}V${y + 1}`);
    if (x === cols - 1 && c.e) walls.push(`M${x + 1} ${y}V${y + 1}`);
    if (y === rows - 1 && c.s) walls.push(`M${x} ${y + 1}H${x + 1}`);
  }
  const wallPath = walls.join(" ");
  const trailPath = trail.map((i, k) => `${k === 0 ? "M" : "L"}${cx(i)} ${cy(i)}`).join(" ");

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const dPad = (
    <div
      className={cn(
        "grid grid-cols-3 grid-rows-3",
        shortViewport ? "w-[min(28vw,8rem)] gap-1" : "mx-auto w-[min(42vw,11rem)] gap-1.5",
      )}
    >
      <Pad
        className="col-start-2 row-start-1"
        onPress={() => move("n")}
        label="Up"
        compact={shortViewport}
      >
        <ChevronUp className={shortViewport ? "h-5 w-5" : "h-6 w-6"} />
      </Pad>
      <Pad
        className="col-start-1 row-start-2"
        onPress={() => move("w")}
        label="Left"
        compact={shortViewport}
      >
        <ChevronLeft className={shortViewport ? "h-5 w-5" : "h-6 w-6"} />
      </Pad>
      <Pad
        className="col-start-3 row-start-2"
        onPress={() => move("e")}
        label="Right"
        compact={shortViewport}
      >
        <ChevronRight className={shortViewport ? "h-5 w-5" : "h-6 w-6"} />
      </Pad>
      <Pad
        className="col-start-2 row-start-3"
        onPress={() => move("s")}
        label="Down"
        compact={shortViewport}
      >
        <ChevronDown className={shortViewport ? "h-5 w-5" : "h-6 w-6"} />
      </Pad>
    </div>
  );

  return (
    <div
      className="no-scroll-screen fixed inset-0 flex flex-col select-none tracking-normal"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* HUD */}
      <header className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <Link
          to={MAZE_RANK_HOME}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full border border-border/60 text-foreground transition-colors hover:text-primary active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 text-center">
          <div className="truncate text-base font-semibold text-foreground sm:text-lg">
            {name}
          </div>
          <div className="text-sm text-foreground tabular-nums sm:text-base lg:hidden">
            {mm}:{ss}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle
            className="h-11 w-11 border-border/60 text-foreground hover:text-primary"
            iconClassName="h-5 w-5"
          />
          <button
            onClick={() => setAttempt((a) => a + 1)}
            disabled={quizActive}
            aria-label="Restart"
            className="grid h-11 w-11 place-items-center rounded-full border border-border/60 text-foreground transition-colors hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "relative flex min-h-0 flex-1",
          shortViewport ? "flex-row items-stretch" : "flex-col",
        )}
      >
        {/* Maze */}
        <div className="relative mx-auto min-h-0 min-w-0 w-full max-w-3xl flex-1 px-2 pb-1">
          <svg
            viewBox={`-0.6 -0.6 ${cols + 1.2} ${rows + 1.2}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full"
          >
            <g style={{ color: "var(--maze-line)" }}>
              <path
                d={wallPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.16"
                strokeLinecap="round"
                opacity="0.35"
                style={{ filter: "blur(0.14px)" }}
              />
              <path
                d={wallPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.075"
                strokeLinecap="round"
              />
            </g>

            <path
              d={trailPath}
              fill="none"
              stroke="var(--maze-trail)"
              strokeWidth="0.14"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.75"
              className={won ? "trail-flash" : undefined}
            />

            <GoalMarker x={goalX} y={goalY} won={won} />

            {won &&
              [0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${goalX} ${goalY})`}>
                  <circle
                    r="0.28"
                    fill="none"
                    stroke="var(--goal)"
                    strokeWidth="0.1"
                    className="goal-burst-ring"
                    style={{ animationDelay: `${i * 110}ms`, color: "var(--goal)" }}
                  />
                </g>
              ))}

            {!won && (
              <circle
                cx={cx(pos)}
                cy={cy(pos)}
                r="0.34"
                fill="none"
                stroke="var(--player)"
                strokeWidth="0.035"
                opacity="0.28"
                className="goal-idle"
                style={{ transition: "cx 90ms linear, cy 90ms linear" }}
              />
            )}
            <circle
              cx={cx(pos)}
              cy={cy(pos)}
              r="0.22"
              fill="var(--player)"
              className={cn(!won && "pulse-glow", won && "player-capture")}
              style={{
                color: "var(--player)",
                transition: won ? undefined : "cx 90ms linear, cy 90ms linear",
              }}
            />
          </svg>

          {showWinPanel && (
            <WinPanel
              level={level}
              name={name}
              color={color}
              time={`${mm}:${ss}`}
              nextRank={nextRank}
              nextSlug={nextSlug}
              onMap={() => navigate({ to: MAZE_RANK_HOME })}
              onNext={() =>
                nextSlug && navigate({ to: MAZE_RANK_PLAY_ROUTE, params: { rank: nextSlug } })
              }
            />
          )}

          {activeQuiz && <QuizModal quiz={activeQuiz} color={color} onAnswer={handleQuizAnswer} />}
        </div>

        {/* Touch pad — side (short) or bottom (portrait mobile/tablet) */}
        <div
          className={cn(
            "shrink-0 lg:hidden",
            shortViewport
              ? "flex items-center pr-[max(0.75rem,env(safe-area-inset-right))] pl-1"
              : "px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            (won || quizActive) && "pointer-events-none opacity-30",
          )}
        >
          {dPad}
        </div>
      </div>

      {/* Timer — desktop */}
      <div className="hidden shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center lg:block">
        <div className="text-sm text-foreground tabular-nums sm:text-base">
          {mm}:{ss}
        </div>
      </div>
    </div>
  );
}

function GoalMarker({ x, y, won }: { x: number; y: number; won: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} style={{ color: "var(--goal)" }}>
      {!won && (
        <circle
          r="0.42"
          fill="none"
          stroke="var(--goal)"
          strokeWidth="0.035"
          strokeDasharray="0.08 0.14"
          opacity="0.45"
          className="goal-orbit"
        />
      )}
      <circle
        r="0.36"
        fill="none"
        stroke="var(--goal)"
        strokeWidth="0.045"
        opacity={won ? 0.9 : 0.5}
        className={won ? "goal-flash" : "goal-idle"}
      />
      <circle
        r="0.26"
        fill="none"
        stroke="var(--goal)"
        strokeWidth="0.08"
        className={won ? undefined : "pulse-glow"}
      />
      <circle
        r="0.1"
        fill="var(--goal)"
        opacity={won ? 1 : 0.85}
        className={won ? "goal-flash" : "goal-idle"}
      />
    </g>
  );
}

function WinPanel({
  level,
  name,
  color,
  time,
  nextRank,
  nextSlug,
  onMap,
  onNext,
}: {
  level: number;
  name: string;
  color: string;
  time: string;
  nextRank: string | undefined;
  nextSlug: string | undefined;
  onMap: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="win-overlay-in absolute inset-0 grid place-items-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, color-mix(in oklab, var(--goal) 18%, transparent), var(--overlay-scrim))",
      }}
    >
      <div
        className="win-card-in relative w-full max-w-sm max-h-[min(90dvh,36rem)] overflow-y-auto rounded-3xl border border-border bg-background/90 p-6 shadow-2xl backdrop-blur-xl"
        style={{
          boxShadow: `0 0 60px color-mix(in oklab, ${color} 25%, transparent), 0 24px 48px color-mix(in oklab, var(--foreground) 12%, transparent)`,
        }}
      >
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `color-mix(in oklab, ${color} 35%, transparent)` }}
        />

        <div className="relative flex flex-col items-center text-center">
          <div className="win-badge-pop relative mb-4">
            <div
              className="grid h-20 w-20 place-items-center rounded-full border"
              style={{
                color,
                borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
                background: `radial-gradient(circle at 50% 30%, color-mix(in oklab, ${color} 28%, transparent), transparent 70%)`,
                boxShadow: `0 0 28px color-mix(in oklab, ${color} 40%, transparent)`,
              }}
            >
              <RankBadge index={level} size={36} />
            </div>
            <Sparkles
              className="win-spark absolute -top-1 -right-1 h-5 w-5"
              style={{ color }}
              aria-hidden
            />
          </div>

          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            {name}
          </h2>

          <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2">
            <Trophy className="h-4 w-4 text-[var(--goal)]" aria-hidden />
            <span className="font-mono text-lg tabular-nums tracking-wide text-foreground">{time}</span>
          </div>

          {nextRank && (
            <p className="mt-3 text-sm text-foreground">
              <span className="font-semibold">{nextRank}</span> unlocked
            </p>
          )}

          <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
            {nextSlug && (
              <button
                type="button"
                lang="km"
                onClick={onNext}
                className="font-khmer flex-1 rounded-2xl px-4 py-3 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
                style={{
                  background: `color-mix(in oklab, ${color} 88%, transparent)`,
                  boxShadow: `0 0 24px color-mix(in oklab, ${color} 35%, transparent)`,
                }}
              >
                វគ្គបន្ទាប់
              </button>
            )}
            <button
              type="button"
              lang="km"
              onClick={onMap}
              className={cn(
                "font-khmer rounded-2xl border border-border bg-muted/40 px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/70 active:scale-[0.98]",
                nextSlug ? "flex-1" : "w-full",
              )}
            >
              ត្រលប់
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pad({
  onPress,
  children,
  className,
  label,
  compact,
}: {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={cn(
        "grid place-items-center rounded-2xl border border-border/50 bg-card/40 text-foreground backdrop-blur-sm transition-transform active:scale-90",
        compact ? "h-11 w-11" : "h-14 w-14",
        className,
      )}
    >
      {children}
    </button>
  );
}
