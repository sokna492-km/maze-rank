import { Html, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { RankBadge } from "@/components/rank-icons/RankBadge";
import { useRef } from "react";
import * as THREE from "three";

import type { RankNodeState } from "@/lib/rank-path";
import { MAZE_RANK_PLAY_ROUTE } from "@/lib/rank-path";

type RankNode3DProps = {
  rank: string;
  slug: string;
  index: number;
  state: RankNodeState;
  color: string;
  position: [number, number, number];
};

export function RankNode3D({ rank, slug, index, state, color, position }: RankNode3DProps) {
  const navigate = useNavigate();
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const invalidate = useThree((state) => state.invalidate);
  const scale = state === "current" ? 1.2 : 0.85;
  const locked = state === "locked";

  useFrame((frameState) => {
    if (!mesh.current || !material.current) return;
    if (state === "current") {
      const pulse = 1 + Math.sin(frameState.clock.elapsedTime * 2) * 0.06;
      mesh.current.scale.setScalar(scale * pulse);
      material.current.emissiveIntensity = 0.65 + Math.sin(frameState.clock.elapsedTime * 2) * 0.2;
      invalidate();
    }
  });

  const handleSelect = () => {
    if (locked) return;
    navigate({ to: MAZE_RANK_PLAY_ROUTE, params: { rank: slug } });
  };

  return (
    <group position={position}>
      <RoundedBox
        ref={mesh}
        args={[1, 1, 0.35]}
        radius={0.18}
        smoothness={4}
        scale={scale}
        onClick={handleSelect}
        onPointerOver={() => {
          if (!locked) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <meshStandardMaterial
          ref={material}
          color={color}
          emissive={color}
          emissiveIntensity={locked ? 0.08 : state === "done" ? 0.35 : 0.55}
          transparent={locked}
          opacity={locked ? 0.45 : 1}
          toneMapped={false}
        />
      </RoundedBox>

      <Html center position={[0, -0.95, 0]} distanceFactor={8} zIndexRange={[10, 0]}>
        <div className="pointer-events-auto flex flex-col items-center gap-1.5 select-none">
          <div
            className="relative grid h-7 w-7 place-items-center rounded-md border border-border/40 bg-background/80 backdrop-blur-sm"
            style={{ color: locked ? undefined : color }}
            aria-hidden
          >
            <RankBadge index={index} size={14} className={locked ? "opacity-35" : undefined} />
            {locked && (
              <div className="absolute inset-0 grid place-items-center">
                <Lock className="h-3 w-3 text-muted-foreground/80" />
              </div>
            )}
          </div>
          {locked ? (
            <span
              className="text-[0.55rem] tracking-[0.18em] text-muted-foreground/50 uppercase"
              aria-disabled
            >
              {rank}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSelect}
              aria-label={rank}
              className="text-[0.55rem] tracking-[0.18em] uppercase transition-opacity hover:opacity-100"
              style={state === "current" ? { color } : undefined}
            >
              <span className={state === "current" ? "" : "text-foreground/75"}>{rank}</span>
            </button>
          )}
        </div>
      </Html>
    </group>
  );
}
