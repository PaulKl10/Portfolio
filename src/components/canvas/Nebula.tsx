"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_POSITIONS, SKILLS } from "@/lib/constants";

const NEBULA_CENTER_Z =
  (CAMERA_POSITIONS.nebulaStart + CAMERA_POSITIONS.nebulaEnd) / 2;
const LAYER_COUNT = 8;

// --- Volumetric nebula layers ---

const nebulaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  uniform float uTime;
  uniform float uSeed;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uOpacity;

  varying vec2 vUv;

  // Simplex-like hash
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,   // (3.0-sqrt(3.0))/6.0
      0.366025403784439,   // 0.5*(sqrt(3.0)-1.0)
     -0.577350269189626,   // -1.0 + 2.0 * C.x
      0.024390243902439    // 1.0 / 41.0
    );
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float t = uTime * 0.08;

    // Single-level domain warping (cheaper, still organic)
    vec2 q = vec2(
      fbm(uv * 2.0 + uSeed + t * 0.3),
      fbm(uv * 2.0 + uSeed + 5.2 + t * 0.2)
    );

    float n = fbm(uv * 2.0 + 3.0 * q);

    // Shape: fade at edges for soft cloud shape
    float dist = length(uv) * 2.0;
    float edgeFade = smoothstep(1.0, 0.3, dist);

    // Color mixing driven by noise
    float colorMix = n * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, colorMix);

    // Add bright cores
    float brightness = smoothstep(0.2, 0.8, n) * 0.6 + 0.4;
    color *= brightness;

    // Wispy alpha
    float alpha = smoothstep(-0.3, 0.5, n) * edgeFade * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

// --- Skill particles (kept from original) ---

const skillVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * 0.3 + position.z * 0.1) * 2.0;
    pos.y += cos(uTime * 0.2 + position.x * 0.1) * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vColor = aColor;
    vAlpha = 0.15 + 0.1 * sin(uTime + position.x);
    gl_PointSize = aSize * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const skillFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * 3.0;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface NebulaLayerData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  seed: number;
  color1: THREE.Color;
  color2: THREE.Color;
  opacity: number;
}

function NebulaLayer({
  data,
  timeRef,
}: {
  data: NebulaLayerData;
  timeRef: React.RefObject<number>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: data.seed },
      uColor1: { value: data.color1 },
      uColor2: { value: data.color2 },
      uOpacity: { value: data.opacity },
    }),
    [data],
  );

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  return (
    <mesh
      position={data.position}
      rotation={data.rotation}
      scale={data.scale}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function Nebula() {
  const skillMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const layers = useMemo<NebulaLayerData[]>(() => {
    const palette = [
      { c1: new THREE.Color("#6b21a8"), c2: new THREE.Color("#00d4ff") },
      { c1: new THREE.Color("#a855f7"), c2: new THREE.Color("#3b82f6") },
      { c1: new THREE.Color("#7c3aed"), c2: new THREE.Color("#06b6d4") },
      { c1: new THREE.Color("#4c1d95"), c2: new THREE.Color("#8b5cf6") },
    ];

    return Array.from({ length: LAYER_COUNT }, (_, i) => {
      const p = palette[i % palette.length];
      const angle = (i / LAYER_COUNT) * Math.PI * 2;
      const spread = 40;

      return {
        position: [
          Math.cos(angle) * spread * (0.5 + Math.sin(i * 1.7) * 0.5),
          Math.sin(angle) * spread * 0.5,
          NEBULA_CENTER_Z + (Math.sin(i * 2.3) * 40),
        ] as [number, number, number],
        rotation: [
          Math.sin(i * 0.7) * 0.4,
          Math.cos(i * 1.1) * 0.4,
          (i * Math.PI) / LAYER_COUNT,
        ] as [number, number, number],
        scale: 80 + Math.sin(i * 1.3) * 30,
        seed: i * 13.37,
        color1: p.c1,
        color2: p.c2,
        opacity: 0.12 + Math.sin(i * 0.9) * 0.05,
      };
    });
  }, []);

  const skillData = useMemo(() => {
    const positions = new Float32Array(SKILLS.length * 3);
    const colors = new Float32Array(SKILLS.length * 3);
    const sizes = new Float32Array(SKILLS.length);

    SKILLS.forEach((skill, i) => {
      const angle = (i / SKILLS.length) * Math.PI * 2;
      const radius = 30 + Math.sin(i * 2.1) * 20;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] =
        Math.sin(angle) * radius * 0.6 + Math.sin(i * 3.7) * 10;
      positions[i * 3 + 2] = NEBULA_CENTER_Z + Math.sin(i * 1.5) * 30;

      const c = new THREE.Color(skill.color);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 6 + Math.sin(i * 2.3) * 2;
    });

    return { positions, colors, sizes };
  }, []);

  // Single useFrame for the whole Nebula — time propagated via ref to all layers
  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime();
    if (skillMaterialRef.current) {
      skillMaterialRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  return (
    <group>
      {/* Volumetric nebula layers */}
      {layers.map((data, i) => (
        <NebulaLayer key={i} data={data} timeRef={timeRef} />
      ))}

      {/* Skill particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[skillData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[skillData.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[skillData.colors, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={skillMaterialRef}
          vertexShader={skillVertexShader}
          fragmentShader={skillFragmentShader}
          uniforms={{ uTime: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
