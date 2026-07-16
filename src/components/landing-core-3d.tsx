"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type PointerValue = { x: number; y: number };

type ParticleStructures = {
  base: Float32Array;
  helix: Float32Array;
  lattice: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
};

const CORE_COUNT = 1600;
const ORBIT_COUNT = 540;
const CARD_COUNT = 420;
const TOTAL_COUNT = CORE_COUNT + ORBIT_COUNT + CARD_COUNT;

export function LandingCoreScene({
  hoverRef,
  isVisible,
  pointerRef,
  progressRef,
  reducedMotion,
}: {
  hoverRef: MutableRefObject<number>;
  isVisible: boolean;
  pointerRef: MutableRefObject<PointerValue>;
  progressRef?: MutableRefObject<number>;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      camera={{ fov: 36, near: 0.1, far: 24, position: [0, 0, 7.8] }}
      dpr={[1, 1.55]}
      frameloop={isVisible && !reducedMotion ? "always" : "demand"}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        gl.setClearAlpha(0);
        scene.background = null;
      }}
    >
      <ParticleLearningCore
        hoverRef={hoverRef}
        pointerRef={pointerRef}
        progressRef={progressRef}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

function ParticleLearningCore({
  hoverRef,
  pointerRef,
  progressRef,
  reducedMotion,
}: {
  hoverRef: MutableRefObject<number>;
  pointerRef: MutableRefObject<PointerValue>;
  progressRef?: MutableRefObject<number>;
  reducedMotion: boolean;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const structures = useMemo(() => createParticleStructures(), []);
  const dotTexture = useMemo(() => createDotTexture(), []);
  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(structures.base.slice(), 3));
    value.setAttribute("color", new THREE.BufferAttribute(structures.colors, 3));
    value.setAttribute("aSize", new THREE.BufferAttribute(structures.sizes, 1));
    value.computeBoundingSphere();
    return value;
  }, [structures]);

  useEffect(() => () => {
    geometry.dispose();
    dotTexture.dispose();
  }, [dotTexture, geometry]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    const material = materialRef.current;
    const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    if (!root || !material || reducedMotion) return;

    const pointer = pointerRef.current;
    const scrollProgress = progressRef?.current ?? 0;
    const isHovered = hoverRef.current > 0.5;
    const target = isHovered
      ? pointer.x < 0
        ? structures.helix
        : structures.lattice
      : scrollProgress > 0.52
        ? structures.lattice
        : scrollProgress > 0.16
          ? structures.helix
          : structures.base;
    const positions = attribute.array as Float32Array;
    const response = 1 - Math.exp(-delta * (isHovered ? 5.2 : 3.2));

    for (let index = 0; index < positions.length; index += 1) {
      positions[index] += (target[index] - positions[index]) * response;
    }
    attribute.needsUpdate = true;

    const rotationResponse = 1 - Math.exp(-delta * 3.6);
    root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, pointer.y * 0.14, rotationResponse);
    root.rotation.y = THREE.MathUtils.lerp(
      root.rotation.y,
      pointer.x * 0.2 + scrollProgress * Math.PI * 0.7,
      rotationResponse,
    );
    root.rotation.z += delta * (isHovered ? 0.025 : 0.008);
    material.size = THREE.MathUtils.lerp(material.size, isHovered ? 0.072 : 0.056, response);
    material.opacity = THREE.MathUtils.lerp(material.opacity, isHovered ? 1 : 0.9, response);
  });

  return (
    <group ref={rootRef} rotation={[0.06, -0.2, -0.03]}>
      <points geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          ref={materialRef}
          blending={THREE.AdditiveBlending}
          color="#ffffff"
          depthWrite={false}
          map={dotTexture}
          opacity={0.9}
          size={0.056}
          sizeAttenuation
          transparent
          vertexColors
        />
      </points>
    </group>
  );
}

function createParticleStructures(): ParticleStructures {
  const base = new Float32Array(TOTAL_COUNT * 3);
  const helix = new Float32Array(TOTAL_COUNT * 3);
  const lattice = new Float32Array(TOTAL_COUNT * 3);
  const colors = new Float32Array(TOTAL_COUNT * 3);
  const sizes = new Float32Array(TOTAL_COUNT);
  const violet = new THREE.Color("#8177ff");
  const lavender = new THREE.Color("#c5c0ff");
  const mint = new THREE.Color("#69e8bd");
  const amber = new THREE.Color("#f2c963");
  const paper = new THREE.Color("#f3f0e8");
  const scratch = new THREE.Vector3();

  for (let index = 0; index < CORE_COUNT; index += 1) {
    const normalized = index / Math.max(1, CORE_COUNT - 1);
    const y = 1 - normalized * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = index * Math.PI * (3 - Math.sqrt(5));
    const shell = 1.48 + seeded(index, 4) * 0.12;
    setPoint(base, index, Math.cos(theta) * radius * shell, y * shell, Math.sin(theta) * radius * shell);

    const strand = index % 2;
    const helixT = Math.floor(index / 2) / Math.max(1, CORE_COUNT / 2 - 1);
    const helixAngle = helixT * Math.PI * 12 + strand * Math.PI;
    const helixRadius = 0.78 + Math.sin(helixT * Math.PI * 4) * 0.1;
    setPoint(
      helix,
      index,
      Math.cos(helixAngle) * helixRadius,
      (helixT - 0.5) * 4.25,
      Math.sin(helixAngle) * helixRadius,
    );

    const gridSize = 12;
    const gridIndex = index % (gridSize * gridSize * gridSize);
    const gridX = gridIndex % gridSize;
    const gridY = Math.floor(gridIndex / gridSize) % gridSize;
    const gridZ = Math.floor(gridIndex / (gridSize * gridSize));
    setPoint(
      lattice,
      index,
      (gridX / (gridSize - 1) - 0.5) * 3.25,
      (gridY / (gridSize - 1) - 0.5) * 3.25,
      (gridZ / (gridSize - 1) - 0.5) * 2.5,
    );

    const coreColor = violet.clone().lerp(lavender, normalized * 0.65 + seeded(index, 9) * 0.22);
    setColor(colors, index, coreColor);
    sizes[index] = 1.1 + seeded(index, 11) * 1.25;
  }

  const orbitRotations = [
    new THREE.Euler(1.08, 0.12, 0.48),
    new THREE.Euler(0.18, 1.18, -0.42),
    new THREE.Euler(1.58, -0.42, 0.12),
  ];
  const orbitColors = [mint, violet, amber];

  for (let offset = 0; offset < ORBIT_COUNT; offset += 1) {
    const index = CORE_COUNT + offset;
    const orbit = Math.floor(offset / (ORBIT_COUNT / 3));
    const local = offset % (ORBIT_COUNT / 3);
    const normalized = local / (ORBIT_COUNT / 3);
    const angle = normalized * Math.PI * 2;
    const radius = 2.05 + orbit * 0.2;
    scratch.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0).applyEuler(orbitRotations[orbit]);
    setPoint(base, index, scratch.x, scratch.y, scratch.z);

    const streamX = (normalized - 0.5) * 5.1;
    setPoint(
      helix,
      index,
      streamX,
      (orbit - 1) * 1.25 + Math.sin(normalized * Math.PI * (4 + orbit)) * 0.22,
      Math.cos(normalized * Math.PI * 4 + orbit) * 0.42,
    );

    const latticeAngle = normalized * Math.PI * 2;
    const latticeRadius = 2.05 + orbit * 0.24;
    setPoint(
      lattice,
      index,
      Math.cos(latticeAngle) * latticeRadius,
      (orbit - 1) * 0.76,
      Math.sin(latticeAngle) * latticeRadius * 0.58,
    );

    setColor(colors, index, orbitColors[orbit]);
    sizes[index] = 1.05 + seeded(index, 15) * 0.6;
  }

  const cardCenters = [
    new THREE.Vector3(-2.3, 1.35, 0.25),
    new THREE.Vector3(2.35, 0.72, -0.22),
    new THREE.Vector3(-1.65, -2.0, 0.08),
  ];
  const cardRotations = [
    new THREE.Euler(0.05, 0.3, -0.12),
    new THREE.Euler(0.08, -0.38, 0.1),
    new THREE.Euler(-0.18, 0.2, 0.08),
  ];

  for (let offset = 0; offset < CARD_COUNT; offset += 1) {
    const index = CORE_COUNT + ORBIT_COUNT + offset;
    const card = Math.floor(offset / (CARD_COUNT / 3));
    const local = offset % (CARD_COUNT / 3);
    const normalized = local / (CARD_COUNT / 3);
    const point = rectanglePoint(normalized, 1.22, 0.78, scratch);
    point.applyEuler(cardRotations[card]).add(cardCenters[card]);
    setPoint(base, index, point.x, point.y, point.z);

    const helixCardAngle = card * Math.PI * 2 / 3 + Math.PI * 0.25;
    const helixCenterX = Math.cos(helixCardAngle) * 2.25;
    const helixCenterZ = Math.sin(helixCardAngle) * 0.75;
    const helixPoint = rectanglePoint(normalized, 1.1, 0.72, scratch);
    setPoint(helix, index, helixPoint.x + helixCenterX, helixPoint.y + (card - 1) * 1.1, helixPoint.z + helixCenterZ);

    const latticePoint = rectanglePoint(normalized, 3.45, 1.45, scratch);
    setPoint(
      lattice,
      index,
      latticePoint.x,
      latticePoint.y + (card - 1) * 1.08,
      latticePoint.z + (card - 1) * 0.24,
    );

    setColor(colors, index, paper.clone().lerp(orbitColors[card], 0.18));
    sizes[index] = 1.22 + seeded(index, 19) * 0.75;
  }

  return { base, helix, lattice, colors, sizes, count: TOTAL_COUNT };
}

function rectanglePoint(normalized: number, width: number, height: number, target: THREE.Vector3) {
  const perimeter = width * 2 + height * 2;
  const distance = normalized * perimeter;
  if (distance < width) return target.set(-width / 2 + distance, height / 2, 0);
  if (distance < width + height) return target.set(width / 2, height / 2 - (distance - width), 0);
  if (distance < width * 2 + height) return target.set(width / 2 - (distance - width - height), -height / 2, 0);
  return target.set(-width / 2, -height / 2 + (distance - width * 2 - height), 0);
}

function setPoint(array: Float32Array, index: number, x: number, y: number, z: number) {
  const offset = index * 3;
  array[offset] = x;
  array[offset + 1] = y;
  array[offset + 2] = z;
}

function setColor(array: Float32Array, index: number, color: THREE.Color) {
  const offset = index * 3;
  array[offset] = color.r;
  array[offset + 1] = color.g;
  array[offset + 2] = color.b;
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.345 + salt * 17.123) * 47453.5453;
  return value - Math.floor(value);
}

function createDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.98)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.42)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
