"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { VoiceOrbTone } from "@/components/voice-orb";

type Palette = {
  deep: string;
  cyan: string;
  magenta: string;
  highlight: string;
};

type BlobUniforms = {
  uTime: { value: number };
  uEnergy: { value: number };
  uPhase: { value: number };
  uOpacity: { value: number };
  uDeep: { value: THREE.Color };
  uCyan: { value: THREE.Color };
  uMagenta: { value: THREE.Color };
  uHighlight: { value: THREE.Color };
};

const PALETTES: Record<VoiceOrbTone, Palette> = {
  neutral: {
    deep: "#131b4d",
    cyan: "#5bcbe2",
    magenta: "#b873d0",
    highlight: "#e8fbff",
  },
  success: {
    deep: "#0a3e40",
    cyan: "#67d9be",
    magenta: "#a8dc91",
    highlight: "#effff7",
  },
  error: {
    deep: "#4a1c37",
    cyan: "#e897aa",
    magenta: "#d86689",
    highlight: "#fff0f2",
  },
  coach: {
    deep: "#493526",
    cyan: "#e6c36d",
    magenta: "#d78ca5",
    highlight: "#fff8d7",
  },
};

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uEnergy;
  uniform float uPhase;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vWave;
  varying float vRibbon;

  void main() {
    vec3 p = position;
    float time = uTime + uPhase;

    float waveA = sin(p.x * 3.1 + time * 0.92) * sin(p.y * 2.45 - time * 0.61);
    float waveB = sin(p.z * 3.55 - time * 0.73) * cos(p.x * 2.2 + time * 0.48);
    float waveC = cos((p.x + p.y - p.z) * 2.15 + time * 0.57);
    float wave = waveA * 0.46 + waveB * 0.34 + waveC * 0.2;

    float displacement = wave * (0.082 + uEnergy * 0.082);
    p += normal * displacement;
    p.x += sin(p.y * 2.8 - time * 0.54) * (0.018 + uEnergy * 0.014);
    p.y += cos(p.z * 2.5 + time * 0.47) * (0.016 + uEnergy * 0.013);
    p.z += sin(p.x * 2.35 + time * 0.4) * (0.014 + uEnergy * 0.012);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWave = wave;
    vRibbon = sin((p.x * 2.8 + p.y * 3.4 - p.z * 2.1) + time * 0.66);

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uEnergy;
  uniform float uPhase;
  uniform float uOpacity;
  uniform vec3 uDeep;
  uniform vec3 uCyan;
  uniform vec3 uMagenta;
  uniform vec3 uHighlight;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vWave;
  varying float vRibbon;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normal, viewDirection), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.15);

    float flowOne = 0.5 + 0.5 * sin(
      vWorldPosition.y * 3.4 +
      vWorldPosition.x * 2.1 -
      uTime * 0.48 +
      vWave * 1.35 +
      uPhase
    );
    float flowTwo = 0.5 + 0.5 * sin(
      vWorldPosition.z * 3.8 -
      vWorldPosition.x * 2.2 +
      uTime * 0.38 -
      uPhase * 0.7
    );
    float flowThree = 0.5 + 0.5 * sin(vRibbon * 1.45 + uTime * 0.22 + uPhase * 0.4);
    float cyanField = smoothstep(0.04, 0.96, flowOne * 0.68 + flowThree * 0.32);
    float magentaField = smoothstep(0.04, 0.96, flowTwo * 0.66 + (1.0 - flowThree) * 0.34);
    float crossFade = smoothstep(
      0.08,
      0.92,
      0.5 + 0.5 * sin((flowOne - flowTwo) * 2.3 + vWave * 0.7)
    );

    vec3 cyanGlass = mix(uDeep, uCyan, 0.24 + cyanField * 0.48);
    vec3 magentaGlass = mix(uDeep, uMagenta, 0.18 + magentaField * 0.46);
    vec3 color = mix(cyanGlass, magentaGlass, 0.2 + crossFade * 0.56);
    vec3 pearl = mix(uCyan, uMagenta, 0.5 + 0.5 * sin(flowThree * 3.2 + fresnel * 2.4));
    color = mix(color, pearl, 0.08 + fresnel * 0.28);

    vec3 fakeLight = normalize(vec3(-0.35, 0.78, 0.92));
    float highlight = pow(max(dot(normal, fakeLight), 0.0), 18.0);
    float innerGlow = smoothstep(-0.75, 1.0, vWave) * (0.08 + uEnergy * 0.16);

    color += uHighlight * highlight * (0.58 + uEnergy * 0.42);
    color = mix(color, uCyan, innerGlow);
    color = mix(color, uHighlight, fresnel * 0.12);

    float alpha = uOpacity * (0.66 + fresnel * 0.28);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function VoiceCore3D({
  energyRef,
  isSpeaking,
  reducedMotion,
  tone,
}: {
  energyRef: MutableRefObject<number>;
  isSpeaking: boolean;
  reducedMotion: boolean;
  tone: VoiceOrbTone;
}) {
  return (
    <Canvas
      camera={{ fov: 33, near: 0.1, far: 20, position: [0, 0, 4.35] }}
      dpr={[1, 1.65]}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        gl.setClearAlpha(0);
        scene.background = null;
      }}
      role="presentation"
      style={{ background: "transparent" }}
    >
      <IridescentBlob
        energyRef={energyRef}
        isSpeaking={isSpeaking}
        reducedMotion={reducedMotion}
        tone={tone}
      />
    </Canvas>
  );
}

function createUniforms(palette: Palette, phase: number, opacity: number): BlobUniforms {
  return {
    uTime: { value: 0 },
    uEnergy: { value: 0.06 },
    uPhase: { value: phase },
    uOpacity: { value: opacity },
    uDeep: { value: new THREE.Color(palette.deep) },
    uCyan: { value: new THREE.Color(palette.cyan) },
    uMagenta: { value: new THREE.Color(palette.magenta) },
    uHighlight: { value: new THREE.Color(palette.highlight) },
  };
}

function IridescentBlob({
  energyRef,
  isSpeaking,
  reducedMotion,
  tone,
}: {
  energyRef: MutableRefObject<number>;
  isSpeaking: boolean;
  reducedMotion: boolean;
  tone: VoiceOrbTone;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const innerMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const palette = PALETTES[tone];
  const outerUniforms = useMemo(() => createUniforms(palette, 0, 0.78), [palette]);
  const innerUniforms = useMemo(() => createUniforms(palette, 2.7, 0.3), [palette]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    const outerMaterial = outerMaterialRef.current;
    const innerMaterial = innerMaterialRef.current;
    if (!root || !outerMaterial || !innerMaterial) return;

    const energy = energyRef.current;
    const activeEnergy = isSpeaking ? energy : 0.07;
    const timeSpeed = reducedMotion ? 0 : isSpeaking ? 0.72 + energy * 0.68 : 0.16;

    outerMaterial.uniforms.uTime.value += delta * timeSpeed;
    innerMaterial.uniforms.uTime.value += delta * timeSpeed * 1.14;
    outerMaterial.uniforms.uEnergy.value = activeEnergy;
    innerMaterial.uniforms.uEnergy.value = activeEnergy * 0.86;

    if (!reducedMotion) {
      root.rotation.y += delta * (isSpeaking ? 0.13 + energy * 0.22 : 0.035);
      root.rotation.x += delta * (isSpeaking ? 0.045 : 0.012);
      if (outerRef.current) outerRef.current.rotation.z += delta * 0.026;
      if (innerRef.current) {
        innerRef.current.rotation.y -= delta * (0.11 + activeEnergy * 0.16);
        innerRef.current.rotation.z += delta * 0.07;
      }
    }

    root.scale.setScalar(0.93 + activeEnergy * 0.12);
  });

  return (
    <group ref={rootRef} rotation={[0.18, -0.28, -0.08]}>
      <mesh ref={innerRef} renderOrder={1} rotation={[-0.4, 0.55, 0.3]} scale={0.72}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={innerMaterialRef}
          blending={THREE.NormalBlending}
          depthWrite={false}
          fragmentShader={FRAGMENT_SHADER}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
          uniforms={innerUniforms}
          vertexShader={VERTEX_SHADER}
        />
      </mesh>

      <mesh ref={outerRef} renderOrder={2}>
        <sphereGeometry args={[1.03, 96, 96]} />
        <shaderMaterial
          ref={outerMaterialRef}
          blending={THREE.NormalBlending}
          depthWrite={false}
          fragmentShader={FRAGMENT_SHADER}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
          uniforms={outerUniforms}
          vertexShader={VERTEX_SHADER}
        />
      </mesh>
    </group>
  );
}
