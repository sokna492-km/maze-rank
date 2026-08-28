import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type RefObject,
  type CSSProperties,
} from "react";
import { Lock, Trophy } from "lucide-react";
import { RankBadge } from "@/components/rank-icons/RankBadge";
import { RANKS, RANK_SLUGS } from "@/lib/maze";
import { getUnlocked } from "@/lib/progress";
import { Leaderboard } from "@/components/Leaderboard";
import { MAZE_RANK_PLAY_ROUTE } from "@/lib/rank-path";
import { useBreakpoint, type Breakpoint } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maze-rank/")({
  head: () => ({
    meta: [
      { title: "KruMath Maze" },
      {
        name: "description",
        content: "Climb ten neon maze ranks from Warrior to Mythical Immortal.",
      },
    ],
  }),
  component: LevelSelect,
});

const RANK_COLORS = [
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#e879f9",
  "#22d3ee",
  "#fb923c",
  "#a3e635",
  "#f472b6",
];

interface NodeData {
  rank: string;
  slug: string;
  i: number;
  x: number;
  y: number;
  color: string;
}

interface LayoutConfig {
  padLeft: number;
  padRight: number;
  ampFactor: number;
  minWidth: number;
  currentOrb: number;
  otherOrb: number;
}

function getLayoutConfig(breakpoint: Breakpoint): LayoutConfig {
  switch (breakpoint) {
    case "mobile":
      return {
        padLeft: 24,
        padRight: 24,
        ampFactor: 0.22,
        minWidth: 640,
        currentOrb: 64,
        otherOrb: 40,
      };
    case "tablet":
      return {
        padLeft: 36,
        padRight: 80,
        ampFactor: 0.26,
        minWidth: 0,
        currentOrb: 72,
        otherOrb: 46,
      };
    case "desktop":
      return {
        padLeft: 48,
        padRight: 96,
        ampFactor: 0.28,
        minWidth: 0,
        currentOrb: 80,
        otherOrb: 52,
      };
  }
}

function buildPath(nodes: NodeData[]): string {
  return nodes
    .map((n, i) => {
      if (i === 0) return `M ${n.x} ${n.y}`;
      const p = nodes[i - 1]!;
      const cx = (p.x + n.x) / 2;
      return `C ${cx} ${p.y}, ${cx} ${n.y}, ${n.x} ${n.y}`;
    })
    .join(" ");
}

function useNodes(
  canvasRef: RefObject<HTMLDivElement | null>,
  scrollRef: RefObject<HTMLDivElement | null>,
  breakpoint: Breakpoint,
) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [layoutWidth, setLayoutWidth] = useState(1000);
  const [layoutHeight, setLayoutHeight] = useState(500);
  const [orbSizes, setOrbSizes] = useState({ current: 80, other: 52 });

  const compute = useCallback(() => {
    const scrollEl = scrollRef.current;
    const canvasEl = canvasRef.current;
    if (!scrollEl || !canvasEl) return;

    const config = getLayoutConfig(breakpoint);
    const viewportW = scrollEl.clientWidth;
    const H = scrollEl.clientHeight;
    const W = breakpoint === "mobile" ? Math.max(viewportW, config.minWidth) : viewportW;

    setLayoutWidth(W);
    setLayoutHeight(H);
    setOrbSizes({ current: config.currentOrb, other: config.otherOrb });

    const PL = config.padLeft;
    const PR = config.padRight;
    const usableW = W - PL - PR;
    const colW = usableW / (RANKS.length - 1);
    const mid = H / 2;
    const amp = H * config.ampFactor;

    setNodes(
      RANKS.map((rank, i) => ({
        rank,
        slug: RANK_SLUGS[i]!,
        i,
        x: PL + i * colW,
        y: mid + (i % 2 === 0 ? -amp : amp) * (0.5 + 0.5 * Math.sin(i * 0.7)),
        color: RANK_COLORS[i] ?? "#63b3ed",
      })),
    );
  }, [canvasRef, scrollRef, breakpoint]);

  useEffect(() => {
    compute();
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const ro = new ResizeObserver(compute);
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [compute, scrollRef]);

  return { nodes, layoutWidth, layoutHeight, orbSizes };
}

function LevelSelect() {
  const [unlocked, setUnlocked] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const breakpoint = useBreakpoint();
  const { nodes, layoutWidth, layoutHeight, orbSizes } = useNodes(canvasRef, scrollRef, breakpoint);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setUnlocked(getUnlocked());
  }, [pathname]);

  useEffect(() => {
    if (breakpoint !== "mobile" || !scrollRef.current || nodes.length === 0) return;
    const currentIndex = Math.min(unlocked, RANKS.length - 1);
    const currentNode = nodes[currentIndex];
    if (!currentNode) return;

    const scrollEl = scrollRef.current;
    const targetScroll = currentNode.x - scrollEl.clientWidth / 2;
    scrollEl.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
  }, [breakpoint, nodes, unlocked]);

  const progress = Math.min(unlocked, RANKS.length - 1);
  const progressPct = (progress / (RANKS.length - 1)) * 100;
  const clipRight = 100 - progressPct;
  const path = nodes.length ? buildPath(nodes) : "";
  const isMobile = breakpoint === "mobile";

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#050608] text-white tracking-normal">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#63b3ed]/[0.05] blur-[120px]" />
      </div>

      <header className="safe-pt relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-[#050608]/90 px-3 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#63b3ed]" />
          <span className="truncate text-xs font-semibold text-white/85 sm:text-sm">
            KruMath Maze
          </span>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open leaderboard"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-[#fbbf24] transition-colors hover:bg-white/5"
          >
            <Trophy className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className={cn(
            "relative min-w-0 flex-1",
            isMobile
              ? "fade-mask-x snap-x snap-proximity overflow-x-auto overflow-y-hidden no-bar"
              : "overflow-hidden",
          )}
        >
          <div
            ref={canvasRef}
            className="relative h-full"
            style={isMobile ? { width: layoutWidth, minWidth: layoutWidth } : { width: "100%" }}
          >
            {nodes.length > 0 && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${layoutWidth} ${layoutHeight}`}
                aria-hidden
              >
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="#63b3ed"
                  strokeOpacity="0.18"
                  strokeWidth="8"
                  strokeLinecap="round"
                  style={{ clipPath: `inset(0 ${clipRight}% 0 0)` }}
                />
                <path
                  d={path}
                  fill="none"
                  stroke="#63b3ed"
                  strokeOpacity="0.85"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  style={{ clipPath: `inset(0 ${clipRight}% 0 0)` }}
                />
                <path
                  d={path}
                  fill="none"
                  stroke="#63b3ed"
                  strokeWidth="1"
                  strokeDasharray="3 9"
                  strokeLinecap="round"
                  className="animate-[dash_2.5s_linear_infinite]"
                  style={{ clipPath: `inset(0 ${clipRight}% 0 0)` }}
                />
              </svg>
            )}

            {nodes.map((node) => {
              const state = node.i < unlocked ? "done" : node.i === unlocked ? "current" : "locked";
              return (
                <RankNode
                  key={node.rank}
                  node={node}
                  state={state}
                  orbSize={state === "current" ? orbSizes.current : orbSizes.other}
                  compactLabel={isMobile && state !== "current"}
                />
              );
            })}
          </div>
        </div>

        <aside
          className="relative z-20 hidden w-32 shrink-0 flex-col border-l border-white/[0.07] bg-[#050608]/90 py-3 pl-3 pr-2 backdrop-blur-xl md:flex lg:w-44 xl:w-52"
          aria-label="Leaderboard"
        >
          <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-white/[0.06] pb-2.5 pr-1">
            <Trophy className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
            <span className="text-[10px] font-semibold text-white/85 lg:text-xs">Leaderboard</span>
          </div>
          <Leaderboard />
        </aside>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[70vh] border-white/10 bg-[#050608] text-white">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-sm font-semibold text-white/85">
              <Trophy className="h-4 w-4 text-[#fbbf24]" />
              Leaderboard
            </DrawerTitle>
          </DrawerHeader>
          <Leaderboard dense className="max-h-[50vh] px-4 pb-4" />
        </DrawerContent>
      </Drawer>
    </main>
  );
}

function RankNode({
  node,
  state,
  orbSize,
  compactLabel,
}: {
  node: NodeData;
  state: "done" | "current" | "locked";
  orbSize: number;
  compactLabel: boolean;
}) {
  const { rank, slug, i, x, y, color } = node;
  const isCurrent = state === "current";
  const isDone = state === "done";
  const isLast = i === RANKS.length - 1;
  const isFirst = i === 0;
  const glowPad = Math.round(orbSize * 0.22);
  const iconSize = isCurrent ? 24 : orbSize >= 72 ? 18 : 16;

  const orb = (
    <div className="group flex flex-col items-center" style={{ color }}>
      <div
        className={[
          "relative flex items-center justify-center rounded-full transition-transform duration-200",
          state !== "locked" && "group-hover:scale-110 group-active:scale-95",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ width: orbSize, height: orbSize }}
      >
        {state !== "locked" && (
          <div
            className="absolute rounded-full opacity-25 blur-xl transition-opacity duration-300 group-hover:opacity-45"
            style={{
              inset: -glowPad,
              background: color,
            }}
          />
        )}
        <div
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: color,
            opacity: isCurrent ? 0.65 : isDone ? 0.4 : 0.15,
          }}
        />
        <div
          className="absolute rounded-full border"
          style={{
            inset: Math.round(orbSize * 0.11),
            borderColor: color,
            opacity: 0.25,
            background: `radial-gradient(circle at 35% 25%, ${color}22, transparent 65%)`,
          }}
        />
        {isCurrent && (
          <div
            className="absolute animate-[spin_12s_linear_infinite] rounded-full border border-dashed"
            style={{
              inset: -(glowPad - 4),
              borderColor: color,
              opacity: 0.3,
            }}
          />
        )}
        <div className="relative z-10 flex items-center justify-center">
          <RankBadge index={i} size={iconSize} className={cn(state === "locked" && "opacity-35")} />
          {state === "locked" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={iconSize * 0.75} className="opacity-90" />
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "mt-2 text-xs font-semibold",
          !compactLabel && "whitespace-nowrap",
          compactLabel || (!isFirst && !isLast)
            ? "text-center"
            : isLast
              ? "text-right"
              : "text-left",
        )}
        style={{
          color:
            state === "locked"
              ? "rgba(255,255,255,0.5)"
              : isCurrent
                ? color
                : "rgba(255,255,255,0.88)",
          transform:
            !compactLabel && isLast
              ? "translateX(-35%)"
              : !compactLabel && isFirst
                ? "translateX(35%)"
                : undefined,
        }}
      >
        {compactLabel ? String(i + 1).padStart(2, "0") : rank}
      </div>
      {isCurrent && (
        <div className="mt-0.5 text-[11px] font-medium text-white/65 sm:text-xs">Current</div>
      )}
      {isDone && !compactLabel && (
        <div className="mt-0.5 font-mono text-[11px] text-white/55 sm:text-xs">
          {String(i + 1).padStart(2, "0")}
        </div>
      )}
    </div>
  );

  const wrapStyle: CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    transform: "translate(-50%, -50%)",
  };

  if (state === "locked") {
    return (
      <div style={wrapStyle} aria-disabled className="cursor-not-allowed">
        {orb}
      </div>
    );
  }

  return (
    <Link
      to={MAZE_RANK_PLAY_ROUTE}
      params={{ rank: slug }}
      style={wrapStyle}
      aria-label={`Play ${rank}`}
    >
      {orb}
    </Link>
  );
}
