import { useEffect, useMemo, useState } from "react";

import { RANKS } from "@/lib/maze";
import { getRankColor, getThemeColors } from "@/lib/rank-path";

export function useThemeColors() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setTick((value) => value + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // tick bumps when html.theme-neon toggles so colors re-resolve from CSS vars
  return useMemo(
    () => ({
      ranks: RANKS.map((_, index) => getRankColor(index)),
      ...getThemeColors(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick intentionally invalidates theme colors
    [tick],
  );
}
