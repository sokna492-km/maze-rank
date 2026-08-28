import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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

export const Route = createFileRoute("/play/$rank")({
  head: ({ params }) => {
    const idx = rankIndexFromSlug(params.rank);
    const name = idx >= 0 ? RANKS[idx]! : "Maze";
    return {
      meta: [
        { title: `${name} — Neon Maze` },
        { name: "description", content: `Solve the ${name} neon labyrinth and unlock the next rank.` },
        { property: "og:title", content: `${name} — Neon Maze` },
        { property: "og:description", content: `Solve the ${name} neon labyrinth.` },
      ],
    };
  },
  component: Play,
});

type Dir = "n" | "e" | "s" | "w";

function Play() {
  const { rank } = Route.useParams();
  const navigate = useNavigate();
  const level = Math.max(0, rankIndexFromSlug(rank));
  const name = RANKS[level]!;
  const color = `var(--rank-${level + 1})`;

  const [attempt, setAttempt] = useState(0);
  const { cols, rows } = useMemo(() => sizeForLevel(level), [level]);
  const maze = useMemo(
    () => generateMaze(cols, rows, (level + 1) * 7919 + attempt * 104729),
    [cols, rows, level, attempt],
  );

  const start = (rows - 1) * cols + Math.floor(cols / 2);
  const goal = Math.floor(cols / 2);

  const [pos, setPos] = useState(start);
  const [trail, setTrail] = useState<number[]>([start]);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setPos(start);
    setTrail([start]);
    setWon(false);
    setSeconds(0);
  }, [start, attempt, level]);

  useEffect(() => {
    if (won) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [won, attempt, level]);

  const move = useCallback(
    (dir: Dir) => {
      if (won) return;
      setPos((current) => {
        const next = canMove(maze, current, dir);
        if (next === null) return current;
        setTrail((t) => (t[t.length - 2] === next ? t.slice(0, -1) : [...t, next]));
        if (next === goal) {
          setWon(true);
          unlockNext(level);
        }
        return next;
      });
    },
    [maze, goal, level, won],
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
      const dir = keys[e.key];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  // Swipe controls
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]!;
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.touches[0]!;
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    const threshold = 22;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "e" : "w") : dy > 0 ? "s" : "n");
    touch.current = { x: t.clientX, y: t.clientY };
  };

  const nextSlug = RANK_SLUGS[level + 1];

  const cx = (i: number) => (i % cols) + 0.5;
  const cy = (i: number) => Math.floor(i / cols) + 0.5;

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

  return (
    <div
      className="no-scroll-screen fixed inset-0 flex flex-col select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* HUD */}
      <header className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <Link
          to="/"
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-primary active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 text-center">
          <div
            className="truncate text-xs tracking-[0.3em] uppercase sm:text-sm"
            style={{ color }}
          >
            {name}
          </div>
          <div className="text-[0.65rem] text-muted-foreground tabular-nums">
            {mm}:{ss}
          </div>
        </div>
        <button
          onClick={() => setAttempt((a) => a + 1)}
          aria-label="Restart"
          className="grid h-11 w-11 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-primary active:scale-95"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </header>

      {/* Maze */}
      <div className="relative min-h-0 flex-1 px-2 pb-1">
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
          />

          <circle
            cx={cx(goal)}
            cy={cy(goal)}
            r="0.26"
            fill="none"
            stroke="var(--goal)"
            strokeWidth="0.08"
            className="pulse-glow"
            style={{ color: "var(--goal)" }}
          />

          <circle
            cx={cx(pos)}
            cy={cy(pos)}
            r="0.22"
            fill="var(--player)"
            className="pulse-glow"
            style={{ color: "var(--player)", transition: "cx 90ms linear, cy 90ms linear" }}
          />
        </svg>

        {won && (
          <div className="animate-fade-in absolute inset-0 grid place-items-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
              <div
                className="pulse-glow grid h-24 w-24 place-items-center rounded-[28%] text-2xl"
                style={{
                  color,
                  border: `1px solid color-mix(in oklab, ${color} 70%, transparent)`,
                  background: `radial-gradient(circle at 50% 30%, color-mix(in oklab, ${color} 30%, transparent), transparent 70%)`,
                }}
              >
                ✓
              </div>
              <div className="text-xs tracking-[0.3em] text-muted-foreground uppercase tabular-nums">
                {mm}:{ss}
              </div>
              <button
                onClick={() => navigate({ to: "/" })}
                aria-label="Back to ranks"
                className="grid h-16 w-16 place-items-center rounded-full text-primary-foreground active:scale-95"
                style={{
                  background: `color-mix(in oklab, ${color} 85%, transparent)`,
                  boxShadow: `0 0 30px color-mix(in oklab, ${color} 45%, transparent)`,
                }}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch pad */}
      <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto grid w-40 grid-cols-3 grid-rows-3 gap-1.5">
          <Pad className="col-start-2 row-start-1" onPress={() => move("n")} label="Up">
            <ChevronUp className="h-6 w-6" />
          </Pad>
          <Pad className="col-start-1 row-start-2" onPress={() => move("w")} label="Left">
            <ChevronLeft className="h-6 w-6" />
          </Pad>
          <Pad className="col-start-3 row-start-2" onPress={() => move("e")} label="Right">
            <ChevronRight className="h-6 w-6" />
          </Pad>
          <Pad className="col-start-2 row-start-3" onPress={() => move("s")} label="Down">
            <ChevronDown className="h-6 w-6" />
          </Pad>
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
}: {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`grid h-12 w-12 place-items-center rounded-2xl border border-border/50 bg-card/40 text-primary/80 backdrop-blur-sm transition-transform active:scale-90 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
