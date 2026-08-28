import { Bloom, EffectComposer } from "@react-three/postprocessing";

type ScenePostFXProps = {
  intensity: number;
  enabled: boolean;
};

export function ScenePostFX({ intensity, enabled }: ScenePostFXProps) {
  if (!enabled || intensity <= 0) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.85} intensity={intensity} mipmapBlur />
    </EffectComposer>
  );
}
