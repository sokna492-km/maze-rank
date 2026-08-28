import * as React from "react";

export const MOBILE_BREAKPOINT = 768;
export const DESKTOP_BREAKPOINT = 1024;

export type Breakpoint = "mobile" | "tablet" | "desktop";

function getBreakpoint(width: number): Breakpoint {
  if (width < MOBILE_BREAKPOINT) return "mobile";
  if (width < DESKTOP_BREAKPOINT) return "tablet";
  return "desktop";
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(() =>
    typeof window !== "undefined" ? getBreakpoint(window.innerWidth) : "desktop",
  );

  React.useEffect(() => {
    const onChange = () => setBreakpoint(getBreakpoint(window.innerWidth));
    const mqlTablet = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    const mqlDesktop = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    mqlTablet.addEventListener("change", onChange);
    mqlDesktop.addEventListener("change", onChange);
    onChange();
    return () => {
      mqlTablet.removeEventListener("change", onChange);
      mqlDesktop.removeEventListener("change", onChange);
    };
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  return useBreakpoint() === "mobile";
}
