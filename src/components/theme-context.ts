import { createContext } from "react";
import type { ResolvedTheme, ThemePreference } from "@/lib/theme";

export type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
