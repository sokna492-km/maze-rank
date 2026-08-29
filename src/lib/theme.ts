export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "maze-rank-theme";

export const THEME_CYCLE: ThemePreference[] = ["system", "light", "dark"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

export function storeTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // ignore quota / private mode
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

export function applyThemeClass(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function nextTheme(current: ThemePreference): ThemePreference {
  const i = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(i + 1) % THEME_CYCLE.length]!;
}

/** Inline boot script — keep in sync with resolve/apply logic above. */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var d=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
