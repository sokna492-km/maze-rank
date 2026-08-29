import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type RefObject,
  type CSSProperties,
} from "react";
import { Home, Lock, Trophy } from "lucide-react";
import { RankBadge } from "@/components/rank-icons/RankBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RANKS, RANK_SLUGS } from "@/lib/maze";
import { getUnlocked } from "@/lib/progress";
import { Leaderboard } from "@/components/Leaderboard";
import { krumathGameSectionUrl } from "@/lib/krumathUrls";
import { MAZE_RANK_PLAY_ROUTE } from "@/lib/rank-path";
import { requirePlayableUser } from "@/lib/requirePlayableUser";
import { useBreakpoint, type Breakpoint } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ location }) => {
    await requirePlayableUser(location.pathname);
  },
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

function rankColorVar(index: number): string {
  return `var(--rank-${index + 1})`;
}

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

function getLayoutConfig(breakpoint: Breakpoint, shortHeight: boolean): LayoutConfig {
  switch (breakpoint) {
    case "mobile":
      return {
        padLeft: 24,
        padRight: 24,
        ampFactor: shortHeight ? 0.14 : 0.22,
        minWidth: 640,
        currentOrb: shortHeight ? 52 : 64,
        otherOrb: shortHeight ? 34 : 40,
      };
    case "tablet":
      return {
        padLeft: 36,
        padRight: 80,
        ampFactor: shortHeight ? 0.16 : 0.22,
        minWidth: 0,
        currentOrb: 72,
        otherOrb: 46,
      };
    case "desktop":
      return {
        padLeft: 48,
        padRight: 96,
        ampFactor: shortHeight ? 0.18 : 0.28,
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

    const viewportW = scrollEl.clientWidth;
    const H = scrollEl.clientHeight;
    const config = getLayoutConfig(breakpoint, H < 500);
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
        color: rankColorVar(i),
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
  const showDrawerLeaderboard = breakpoint !== "desktop";

  return (
    <main className="app-screen relative flex flex-col bg-background text-foreground tracking-normal">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[120px]" />
      </div>

      <header className="safe-pt relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/90 px-3 pb-2 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <a
            href={krumathGameSectionUrl()}
            lang="km"
            aria-label="ទំព័រដើម"
            className="font-khmer inline-flex h-11 max-w-[9rem] shrink-0 items-center gap-1.5 rounded-full border border-border/80 px-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98] sm:max-w-none sm:px-3"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">ទំព័រដើម</span>
          </a>
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            className="hidden h-5 w-5 shrink-0 sm:block"
          />
          <span className="hidden truncate text-sm font-semibold text-foreground sm:inline sm:text-base">
            KruMath Maze
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="h-11 w-11 border-border/80 text-foreground hover:bg-muted" />
          {showDrawerLeaderboard && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open leaderboard"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border/80 text-accent transition-colors hover:bg-muted"
            >
              <Trophy className="h-4 w-4" />
            </button>
          )}
        </div>
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
                <defs>
                  <linearGradient id="path-progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--rank-1)" />
                    <stop offset="35%" stopColor="var(--primary)" />
                    <stop offset="70%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--rank-10)" />
                  </linearGradient>
                  <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Soft track shadow */}
                <path
                  d={path}
                  fill="none"
                  stroke="color-mix(in oklab, var(--foreground) 12%, transparent)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Inner rail */}
                <path
                  d={path}
                  fill="none"
                  stroke="color-mix(in oklab, var(--foreground) 18%, transparent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 10"
                />

                {/* Progress outer glow */}
                <path
                  d={path}
                  fill="none"
                  stroke="url(#path-progress-grad)"
                  strokeOpacity="0.28"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#path-glow)"
                  style={{ clipPath: `inset(0 ${clipRight}% 0 0)` }}
                />

                {/* Progress core */}
                <path
                  d={path}
                  fill="none"
                  stroke="url(#path-progress-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ clipPath: `inset(0 ${clipRight}% 0 0)` }}
                />

                {/* Progress highlight line */}
                <path
                  d={path}
                  fill="none"
                  stroke="color-mix(in oklab, white 70%, var(--primary))"
                  strokeOpacity="0.55"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ clipPath: `inset(0 ${clipRight}% 0 0)` }}
                />

                {/* Flowing dashes along unlocked path */}
                <path
                  d={path}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                  strokeDasharray="6 14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="path-flow"
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
          className="relative z-20 hidden w-44 shrink-0 flex-col border-l border-border/70 bg-background/90 py-3 pl-3 pr-2 backdrop-blur-xl lg:flex xl:w-52"
          aria-label="Leaderboard"
        >
          <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-border/60 pb-2.5 pr-1">
            <Trophy className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="text-sm font-semibold text-foreground">Leaderboard</span>
          </div>
          <Leaderboard />
        </aside>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="flex max-h-[min(85dvh,36rem)] flex-col overflow-hidden border-border bg-background text-foreground">
          <DrawerHeader className="shrink-0 pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-base font-semibold text-foreground">
              <Trophy className="h-4 w-4 text-accent" />
              Leaderboard
            </DrawerTitle>
          </DrawerHeader>
          <div
            className="thin-bar max-h-[min(65dvh,28rem)] overflow-y-auto overscroll-contain px-4 safe-pb touch-pan-y"
            data-vaul-no-drag=""
          >
            <Leaderboard dense embedded />
          </div>
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
  const isLocked = state === "locked";
  const isLast = i === RANKS.length - 1;
  const isFirst = i === 0;
  const glowPad = Math.round(orbSize * 0.28);
  const iconSize = isCurrent ? 26 : orbSize >= 72 ? 20 : 17;
  const ringInset = Math.round(orbSize * 0.1);

  const orb = (
    <div className={cn("group flex flex-col items-center", isCurrent && "orb-float")}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full transition-transform duration-200",
          !isLocked && "group-hover:scale-110 group-active:scale-95",
        )}
        style={{ width: orbSize, height: orbSize }}
      >
        {/* Soft ambient glow */}
        {!isLocked && (
          <div
            className={cn(
              "absolute rounded-full blur-2xl transition-opacity duration-300",
              isCurrent ? "orb-glow-pulse opacity-60" : "opacity-35 group-hover:opacity-55",
            )}
            style={{
              inset: -glowPad,
              background: `radial-gradient(circle, color-mix(in oklab, ${color} 70%, transparent), transparent 70%)`,
            }}
          />
        )}

        {/* Current pulse ring */}
        {isCurrent && (
          <div
            className="orb-ring-pulse absolute rounded-full border-2"
            style={{
              inset: -Math.round(glowPad * 0.55),
              borderColor: color,
              boxShadow: `0 0 18px color-mix(in oklab, ${color} 45%, transparent)`,
            }}
          />
        )}

        {/* Outer shell */}
        <div
          className="absolute inset-0 rounded-full border-2 shadow-md"
          style={{
            borderColor: isLocked
              ? "color-mix(in oklab, var(--foreground) 28%, transparent)"
              : color,
            background: isLocked
              ? "color-mix(in oklab, var(--foreground) 6%, var(--background))"
              : isDone
                ? `linear-gradient(145deg, color-mix(in oklab, ${color} 42%, white), color-mix(in oklab, ${color} 78%, transparent))`
                : `linear-gradient(145deg, color-mix(in oklab, ${color} 55%, white), color-mix(in oklab, ${color} 88%, black))`,
            boxShadow: isLocked
              ? "inset 0 1px 2px color-mix(in oklab, var(--foreground) 8%, transparent)"
              : `0 8px 22px color-mix(in oklab, ${color} 28%, transparent), inset 0 1px 0 color-mix(in oklab, white 55%, transparent)`,
          }}
        />

        {/* Inner glass disc */}
        <div
          className="absolute rounded-full border"
          style={{
            inset: ringInset,
            borderColor: isLocked
              ? "color-mix(in oklab, var(--foreground) 12%, transparent)"
              : `color-mix(in oklab, white 55%, ${color})`,
            background: isLocked
              ? "color-mix(in oklab, var(--background) 80%, transparent)"
              : `radial-gradient(circle at 32% 28%, color-mix(in oklab, white 55%, transparent), color-mix(in oklab, ${color} 18%, transparent) 45%, color-mix(in oklab, ${color} 35%, transparent) 100%)`,
          }}
        />

        {/* Current dashed orbit */}
        {isCurrent && (
          <div
            className="absolute animate-[spin_10s_linear_infinite] rounded-full border border-dashed"
            style={{
              inset: -(glowPad - 6),
              borderColor: color,
              opacity: 0.55,
            }}
          />
        )}

        {/* Done check pip */}
        {isDone && (
          <div
            className="absolute -right-0.5 -bottom-0.5 z-20 grid h-5 w-5 place-items-center rounded-full border-2 border-background text-[10px] font-bold text-primary-foreground"
            style={{ background: color }}
            aria-hidden
          >
            ✓
          </div>
        )}

        <div className="relative z-10 flex items-center justify-center drop-shadow-sm">
          <RankBadge
            index={i}
            size={iconSize}
            className={cn(isLocked && "opacity-40 grayscale")}
          />
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/35 backdrop-blur-[1px]">
              <Lock size={iconSize * 0.7} className="text-foreground" strokeWidth={2.4} />
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "rank-label mt-2.5 text-sm font-semibold text-foreground",
          !compactLabel && "whitespace-nowrap",
          compactLabel || (!isFirst && !isLast)
            ? "text-center"
            : isLast
              ? "text-right"
              : "text-left",
          isCurrent && "font-bold",
        )}
        style={{
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
        <div
          className="mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide text-foreground"
          style={{
            background: `color-mix(in oklab, ${color} 22%, transparent)`,
            border: `1px solid color-mix(in oklab, ${color} 45%, transparent)`,
          }}
        >
          Current
        </div>
      )}
      {isDone && !compactLabel && (
        <div className="mt-0.5 font-mono text-sm text-foreground">
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
    zIndex: isCurrent ? 5 : isDone ? 3 : 2,
  };

  if (isLocked) {
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
