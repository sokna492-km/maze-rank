import { useEffect, useState } from "react";
import { fmt, leaderboard, type Entry } from "@/lib/leaderboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const PODIUM: Record<number, string> = {
  0: "text-[#fbbf24]",
  1: "text-slate-300",
  2: "text-[#fb923c]",
};

export function Leaderboard({ className, dense }: { className?: string; dense?: boolean }) {
  const [rows, setRows] = useState<Entry[]>([]);

  useEffect(() => setRows(leaderboard()), []);

  return (
    <ScrollArea className={cn("min-h-0 flex-1", className)}>
      <ul className={cn("pr-2", dense && "px-1")}>
        {rows.map((r, i) => {
          const podium = PODIUM[i];
          return (
            <li
              key={r.name + i}
              data-you={r.you ? "true" : undefined}
              className={cn(
                "grid grid-cols-[1.25rem_1fr_2.75rem] items-baseline gap-x-1 border-b border-white/[0.04] py-2 tabular-nums last:border-0",
                dense ? "text-xs" : "text-[11px]",
                dense && "py-2.5",
                r.you && "rounded-md bg-[#63b3ed]/10 px-1",
              )}
            >
              <span
                className={cn(
                  "text-right font-medium",
                  r.you ? "text-[#63b3ed]" : (podium ?? "text-white/45"),
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 truncate",
                  r.you
                    ? "font-semibold text-[#63b3ed]"
                    : podium
                      ? `font-semibold ${podium}`
                      : "text-white/80",
                )}
              >
                {r.name}
              </span>
              <span className={cn("text-right", r.you ? "text-[#63b3ed]/75" : "text-white/45")}>
                {fmt(r.seconds)}
              </span>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
