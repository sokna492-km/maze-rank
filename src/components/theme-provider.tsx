import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext } from "@/components/theme-context";
import {
  applyThemeClass,
  getStoredTheme,
  resolveTheme,
  storeTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR-safe defaults; FOUC script already set the html class before paint.
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    storeTheme(next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveTheme("system");
      setResolvedTheme(next);
      applyThemeClass(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
