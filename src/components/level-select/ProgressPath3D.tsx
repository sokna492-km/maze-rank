import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { getProgressFraction, getRankNodePositions } from "@/lib/rank-path";

type ProgressPath3DProps = {
  unlocked: number;
  borderColor: string;
  primaryColor: string;
  tubeSegments: number;
};

export function ProgressPath3D({
  unlocked,
  borderColor,
  primaryColor,
  tubeSegments,
}: ProgressPath3DProps) {
  const progressMat = useRef<THREE.MeshStandardMaterial>(null);
  const invalidate = useThree((state) => state.invalidate);
  const nodes = useMemo(() => getRankNodePositions(), []);

  const curve = useMemo(() => {
    const points = nodes.map((node) => new THREE.Vector3(...node.position));
    return new THREE.CatmullRomCurve3(points);
  }, [nodes]);

  const progressCurve = useMemo(() => {
    const fraction = getProgressFraction(unlocked);
    const samples = 24;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= samples; i++) {
      points.push(curve.getPoint((i / samples) * fraction));
    }
    return points.length >= 2 ? new THREE.CatmullRomCurve3(points) : null;
  }, [curve, unlocked]);

  useFrame((state) => {
    if (!progressMat.current) return;
    progressMat.current.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    invalidate();
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.07, tubeSegments, false]} />
        <meshStandardMaterial color={borderColor} transparent opacity={0.35} />
      </mesh>
      {progressCurve && (
        <mesh>
          <tubeGeometry args={[progressCurve, 32, 0.09, tubeSegments, false]} />
          <meshStandardMaterial
            ref={progressMat}
            color={primaryColor}
            emissive={primaryColor}
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
