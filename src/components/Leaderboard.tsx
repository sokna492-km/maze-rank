import { useEffect, useRef, useState } from "react";
import { fmt, leaderboard, type Entry } from "@/lib/leaderboard";

export function Leaderboard() {
  const [rows, setRows] = useState<Entry[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; top: number } | null>(null);

  useEffect(() => setRows(leaderboard()), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const you = el.querySelector<HTMLElement>("[data-you='true']");
    if (you) el.scrollTop = you.offsetTop - el.clientHeight / 2 + you.clientHeight / 2;
  }, [rows]);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { y: e.clientY, top: el.scrollTop };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !drag.current) return;
    el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="fade-mask no-bar h-full cursor-grab overflow-y-auto overscroll-contain py-[45%] select-none active:cursor-grabbing"
    >
      <ul className="float-soft space-y-6">
        {rows.map((r, i) => (
          <li
            key={r.name + i}
            data-you={r.you ? "true" : undefined}
            className={`flex items-baseline gap-3 text-[0.7rem] tracking-[0.18em] tabular-nums ${
              r.you ? "text-accent" : "text-foreground/55"
            }`}
          >
            <span className="w-5 shrink-0 text-right opacity-50">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate uppercase">{r.name}</span>
            <span className="shrink-0 opacity-70">{fmt(r.seconds)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
