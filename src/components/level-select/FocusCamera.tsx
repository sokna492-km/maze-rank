import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { getRankNodePositions } from "@/lib/rank-path";

type FocusCameraProps = {
  unlocked: number;
  reducedMotion: boolean;
  onAnimatingChange?: (animating: boolean) => void;
};

export function FocusCamera({ unlocked, reducedMotion, onAnimatingChange }: FocusCameraProps) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPos = useRef(new THREE.Vector3(0, 0, 8));
  const desiredLook = useRef(new THREE.Vector3(0, 0, 0));
  const animating = useRef(true);

  useEffect(() => {
    const nodes = getRankNodePositions();
    const focusIndex = Math.min(unlocked, nodes.length - 1);
    const node = nodes[focusIndex]!.position;

    desiredLook.current.set(node[0], node[1], 0);
    desiredPos.current.set(node[0] * 0.35, node[1], 8);
    animating.current = true;
    onAnimatingChange?.(true);

    if (reducedMotion) {
      camera.position.copy(desiredPos.current);
      lookAt.current.copy(desiredLook.current);
      camera.lookAt(lookAt.current);
      animating.current = false;
      onAnimatingChange?.(false);
    }
  }, [unlocked, reducedMotion, camera, onAnimatingChange]);

  useFrame((_, delta) => {
    if (!animating.current || reducedMotion) return;

    const step = 1 - Math.pow(0.001, delta);
    camera.position.lerp(desiredPos.current, step * 2.5);
    lookAt.current.lerp(desiredLook.current, step * 2.5);
    camera.lookAt(lookAt.current);

    if (camera.position.distanceTo(desiredPos.current) < 0.02) {
      animating.current = false;
      onAnimatingChange?.(false);
    }
  });

  return null;
}
