import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { nextTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const LABELS: Record<ThemePreference, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

const ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

type ThemeToggleProps = {
  className?: string;
  iconClassName?: string;
};

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];
  const upcoming = nextTheme(theme);

  return (
    <button
      type="button"
      onClick={() => setTheme(upcoming)}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[upcoming].toLowerCase()}`}
      title={LABELS[theme]}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border transition-colors",
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden />
    </button>
  );
}
