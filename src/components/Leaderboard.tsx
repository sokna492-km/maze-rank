import { useEffect, useState } from "react";
import { fmt, leaderboard, type Entry } from "@/lib/leaderboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const PODIUM: Record<number, string> = {
  0: "text-accent",
  1: "text-muted-foreground",
  2: "text-chart-5",
};

export function Leaderboard({
  className,
  dense,
  /** Skip ScrollArea — parent provides overflow scrolling (e.g. drawer). */
  embedded,
}: {
  className?: string;
  dense?: boolean;
  embedded?: boolean;
}) {
  const [rows, setRows] = useState<Entry[]>([]);

  useEffect(() => setRows(leaderboard()), []);

  const list = (
    <ul className={cn("pr-2", dense && "px-1")}>
      {rows.map((r, i) => {
        const podium = PODIUM[i];
        return (
          <li
            key={r.name + i}
            data-you={r.you ? "true" : undefined}
            className={cn(
              "grid grid-cols-[1.25rem_1fr_2.75rem] items-baseline gap-x-1 border-b border-border/40 py-2 tabular-nums last:border-0",
              "text-sm",
              dense && "py-2.5",
              r.you && "rounded-md bg-primary/10 px-1",
            )}
          >
            <span
              className={cn(
                "text-right font-medium",
                r.you ? "text-primary" : (podium ?? "text-foreground"),
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "min-w-0 truncate",
                r.you
                  ? "font-semibold text-primary"
                  : podium
                    ? `font-semibold ${podium}`
                    : "text-foreground",
              )}
            >
              {r.name}
            </span>
            <span className={cn("text-right", r.you ? "text-primary" : "text-foreground")}>
              {fmt(r.seconds)}
            </span>
          </li>
        );
      })}
    </ul>
  );

  if (embedded) {
    return <div className={className}>{list}</div>;
  }

  return <ScrollArea className={cn("min-h-0 flex-1", className)}>{list}</ScrollArea>;
}
