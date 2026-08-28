import { useCallback, useEffect, useState } from "react";

export type SceneQuality = {
  dpr: [number, number];
  tubeSegments: number;
  bloomIntensity: number;
  bloomEnabled: boolean;
  antialias: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
};

function detectReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function detectMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export function useSceneQuality() {
  const [degraded, setDegraded] = useState(false);
  const [isMobile, setIsMobile] = useState(detectMobile);
  const [reducedMotion, setReducedMotion] = useState(detectReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMotion);

    const onResize = () => setIsMobile(detectMobile());
    window.addEventListener("resize", onResize);

    return () => {
      mq.removeEventListener("change", onMotion);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleDegrade = useCallback(() => setDegraded(true), []);

  const quality: SceneQuality = {
    dpr: degraded ? [1, 1] : isMobile ? [1, 1.25] : [1, 2],
    tubeSegments: isMobile ? 4 : 8,
    bloomIntensity: reducedMotion ? 0 : isMobile ? 0.4 : 0.8,
    bloomEnabled: !reducedMotion,
    antialias: !isMobile && !degraded,
    reducedMotion,
    isMobile,
  };

  return { quality, handleDegrade };
}
