import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lock, Check, Play } from "lucide-react";
import { RANKS, RANK_SLUGS } from "@/lib/maze";
import { getUnlocked } from "@/lib/progress";
import { getName, setName } from "@/lib/leaderboard";
import { Leaderboard } from "@/components/Leaderboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon Maze — Rank Climb" },
      {
        name: "description",
        content:
          "Climb ten neon maze ranks, from Warrior to Mythical Immortal, in a minimalist glowing labyrinth.",
      },
      { property: "og:title", content: "Neon Maze — Rank Climb" },
      {
        property: "og:description",
        content: "Ten glowing mazes. Ten ranks. One climb from Warrior to Mythical Immortal.",
      },
    ],
  }),
  component: LevelSelect,
});

function LevelSelect() {
  const [unlocked, setUnlocked] = useState(0);
  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => setUnlocked(getUnlocked()), []);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, [unlocked]);

  // Bottom (Warrior) to top (Mythical Immortal)
  const nodes = RANKS.map((rank, i) => ({
    rank,
    i,
    x: i % 2 === 0 ? 30 : 70,
    y: 100 - (i * 100) / (RANKS.length - 1),
  }));

  const path = [...nodes]
    .map((n, idx) => `${idx === 0 ? "M" : "L"} ${n.x} ${n.y}`)
    .join(" ");

  return (
    <main className="min-h-screen py-8 pr-[34%] pl-4 sm:py-12">
      <header className="mx-auto flex max-w-md items-center justify-between gap-4">
        <h1 className="neon-text text-lg font-semibold tracking-[0.35em] text-primary uppercase">
          Maze
        </h1>
        <NameField />
        <span className="text-xs tracking-widest text-muted-foreground tabular-nums">
          {Math.min(unlocked, RANKS.length)}/{RANKS.length}
        </span>
      </header>

      <aside className="fixed top-0 right-0 h-screen w-1/3 py-6 pr-4 pl-2">
        <Leaderboard />
      </aside>

      <div className="relative mx-auto mt-8 h-[1200px] w-full max-w-md sm:h-[1320px]">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <path
            d={path}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={path}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="6 6"
            vectorEffect="non-scaling-stroke"
            className="dash-flow opacity-70"
            style={{
              strokeDashoffset: 0,
              clipPath: `inset(${100 - ((Math.min(unlocked, RANKS.length - 1) + 0.001) / (RANKS.length - 1)) * 100}% 0 0 0)`,
            }}
          />
        </svg>

        {nodes.map(({ rank, i, x, y }) => {
          const state = i < unlocked ? "done" : i === unlocked ? "current" : "locked";
          const color = `var(--rank-${i + 1})`;
          return (
            <div
              key={rank}
              ref={state === "current" ? currentRef : undefined}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <RankNode rank={rank} slug={RANK_SLUGS[i]!} state={state} color={color} />
            </div>
          );
        })}
      </div>
    </main>
  );
}

function RankNode({
  rank,
  slug,
  state,
  color,
}: {
  rank: string;
  slug: string;
  state: "done" | "current" | "locked";
  color: string;
}) {
  const size = state === "current" ? "h-24 w-24" : "h-16 w-16";

  const inner = (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative grid ${size} place-items-center rounded-[28%] transition-transform duration-300 ${
          state === "locked" ? "opacity-40" : "hover:scale-105 active:scale-95"
        } ${state === "current" ? "pulse-glow" : ""}`}
        style={{
          color,
          background: `radial-gradient(circle at 50% 30%, color-mix(in oklab, ${color} 28%, transparent), transparent 70%)`,
          border: `1px solid color-mix(in oklab, ${color} ${state === "locked" ? "25%" : "70%"}, transparent)`,
          boxShadow:
            state === "locked" ? "none" : `0 0 24px color-mix(in oklab, ${color} 30%, transparent)`,
        }}
      >
        {state === "locked" ? (
          <Lock className="h-5 w-5" />
        ) : state === "done" ? (
          <Check className="h-6 w-6" />
        ) : (
          <Play className="h-8 w-8 fill-current" />
        )}
      </div>
      <span
        className={`text-[0.65rem] tracking-[0.2em] uppercase ${
          state === "locked" ? "text-muted-foreground/50" : "text-foreground/80"
        }`}
        style={state === "current" ? { color } : undefined}
      >
        {rank}
      </span>
    </div>
  );

  if (state === "locked") return <div aria-disabled>{inner}</div>;

  return (
    <Link to="/play/$rank" params={{ rank: slug }} aria-label={rank}>
      {inner}
    </Link>
  );
}

function NameField() {
  const [value, setValue] = useState("");
  useEffect(() => setValue(getName()), []);
  return (
    <input
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        setName(e.target.value);
      }}
      placeholder="your name"
      aria-label="Your name"
      maxLength={16}
      className="min-w-0 flex-1 bg-transparent text-center text-xs tracking-[0.2em] text-foreground/70 uppercase outline-none placeholder:text-muted-foreground/50"
    />
  );
}
