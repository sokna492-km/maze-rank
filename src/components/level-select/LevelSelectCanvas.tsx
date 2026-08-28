import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useState } from "react";

import { RankPathScene } from "./RankPathScene";
import { useSceneQuality } from "./useSceneQuality";

type LevelSelectCanvasProps = {
  unlocked: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function LevelSelectCanvas({ unlocked, className, style }: LevelSelectCanvasProps) {
  const { quality, handleDegrade } = useSceneQuality();
  const [frameloop, setFrameloop] = useState<"always" | "demand">(
    quality.reducedMotion ? "demand" : "always",
  );

  const onAnimatingChange = useCallback(
    (animating: boolean) => {
      if (quality.reducedMotion) {
        setFrameloop("demand");
        return;
      }
      setFrameloop(animating ? "always" : "demand");
    },
    [quality.reducedMotion],
  );

  useEffect(() => {
    if (quality.reducedMotion) setFrameloop("demand");
  }, [quality.reducedMotion]);

  return (
    <Canvas
      className={className}
      style={{ ...style, background: "transparent" }}
      dpr={quality.dpr}
      frameloop={frameloop}
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 100 }}
    >
      <Suspense fallback={null}>
        <RankPathScene
          unlocked={unlocked}
          quality={quality}
          onDegrade={handleDegrade}
          onAnimatingChange={onAnimatingChange}
        />
      </Suspense>
    </Canvas>
  );
}
