import { PerformanceMonitor } from "@react-three/drei";
import { useMemo } from "react";

import { getRankNodePositions, getRankNodeState } from "@/lib/rank-path";

import { FocusCamera } from "./FocusCamera";
import { ProgressPath3D } from "./ProgressPath3D";
import { RankNode3D } from "./RankNode3D";
import { ScenePostFX } from "./ScenePostFX";
import type { SceneQuality } from "./useSceneQuality";
import { useThemeColors } from "./useThemeColors";

type RankPathSceneProps = {
  unlocked: number;
  quality: SceneQuality;
  onDegrade: () => void;
  onAnimatingChange: (animating: boolean) => void;
};

export function RankPathScene({
  unlocked,
  quality,
  onDegrade,
  onAnimatingChange,
}: RankPathSceneProps) {
  const colors = useThemeColors();
  const nodes = useMemo(() => getRankNodePositions(), []);

  return (
    <>
      <PerformanceMonitor flipflops={3} onDecline={onDegrade} onFallback={onDegrade} />

      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 8]} intensity={0.55} />
      <pointLight position={[0, 0, 4]} intensity={0.35} color={colors.primary} />

      <ProgressPath3D
        unlocked={unlocked}
        borderColor={colors.border}
        primaryColor={colors.primary}
        tubeSegments={quality.tubeSegments}
      />

      {nodes.map((node) => (
        <RankNode3D
          key={node.rank}
          rank={node.rank}
          slug={node.slug}
          index={node.index}
          state={getRankNodeState(node.index, unlocked)}
          color={colors.ranks[node.index]!}
          position={node.position}
        />
      ))}

      <FocusCamera
        unlocked={unlocked}
        reducedMotion={quality.reducedMotion}
        onAnimatingChange={onAnimatingChange}
      />

      <ScenePostFX intensity={quality.bloomIntensity} enabled={quality.bloomEnabled} />
    </>
  );
}
