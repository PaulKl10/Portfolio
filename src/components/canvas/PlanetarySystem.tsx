"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PROJECTS, CAMERA_POSITIONS } from "@/lib/constants";

const SYSTEM_CENTER_Z = (CAMERA_POSITIONS.warpEnd + CAMERA_POSITIONS.project3) / 2;

const PLANET_STYLES = [
  { color1: "#00d4ff", color2: "#0a2a4a", seed: 1.0, style: 0 }, // ocean/ice
  { color1: "#ff6b35", color2: "#4a1a0a", seed: 2.0, style: 1 }, // volcanic
  { color1: "#ffd700", color2: "#8b6914", seed: 3.0, style: 2 }, // marble
];

// GLSL noise implementation (Simplex-style 3D value noise)
const NOISE_GLSL = /* glsl */ `
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                     dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                     dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                     dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                     dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

float fbm(vec3 p, float seed) {
  p += seed * 17.31;
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 3; i++) {
    val += amp * noise(p * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}
`;

const planetVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec3 cameraWorldPos = cameraPosition;
  vViewDir = normalize(cameraWorldPos - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const planetFragmentShader = /* glsl */ `
${NOISE_GLSL}

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uSeed;
uniform int uStyle;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  // Animated surface sample point
  vec3 p = vPosition;
  float slowTime = uTime * 0.08;

  // Rotate sampling point for surface animation
  float sinT = sin(slowTime);
  float cosT = cos(slowTime);
  vec3 rotP = vec3(
    p.x * cosT - p.z * sinT,
    p.y,
    p.x * sinT + p.z * cosT
  );

  float n1 = fbm(rotP * 1.8, uSeed);
  float n2 = fbm(rotP * 3.5 + vec3(n1 * 0.8), uSeed + 5.0);
  float terrain = n1 * 0.6 + n2 * 0.4;
  // Remap to [0,1]
  float t = clamp(terrain * 0.5 + 0.5, 0.0, 1.0);

  vec3 color = mix(uColor2, uColor1, t);

  // Style-specific effects
  if (uStyle == 0) {
    // Ocean: swirling bands, lighter poles
    float swirl = fbm(rotP * 2.5 + vec3(0.0, slowTime * 0.5, 0.0), uSeed + 10.0);
    float polar = abs(vPosition.y) / 1.0; // normalized assuming unit sphere scaled
    color = mix(color, uColor1 * 1.4, clamp(polar * polar * swirl + 0.1, 0.0, 0.6));
    // Deep ocean trenches
    color = mix(uColor2 * 0.6, color, smoothstep(0.2, 0.5, t));
  } else if (uStyle == 1) {
    // Volcanic: cracks glow brighter, lava rivers
    float crack = fbm(rotP * 5.0 + vec3(slowTime * 0.3), uSeed + 20.0);
    float lava = smoothstep(0.55, 0.75, 1.0 - t + crack * 0.3);
    vec3 lavaColor = vec3(1.0, 0.3, 0.0) * (1.5 + 0.5 * sin(uTime * 2.0 + crack * 6.28));
    color = mix(color, lavaColor, lava * 0.8);
    // Darkened crust
    color = mix(color * 0.5, color, smoothstep(0.1, 0.4, t));
  } else {
    // Marble: golden swirling veins
    float vein = abs(sin(terrain * 8.0 + n2 * 4.0));
    float shimmer = 0.5 + 0.5 * sin(uTime * 1.5 + vein * 3.14);
    vec3 highlight = mix(uColor1, vec3(1.0, 1.0, 0.9), 0.6);
    color = mix(color, highlight, vein * 0.4 * shimmer);
  }

  // Fresnel rim glow (atmosphere)
  float fresnel = pow(1.0 - clamp(dot(vWorldNormal, vViewDir), 0.0, 1.0), 3.5);
  vec3 rimColor = uColor1 * 1.5;
  color = mix(color, rimColor, fresnel * 0.6);

  // Simple lighting: diffuse from a directional approximation
  float diffuse = clamp(dot(vNormal, normalize(vec3(1.0, 0.5, 1.0))), 0.05, 1.0);
  color *= 0.4 + 0.6 * diffuse;

  gl_FragColor = vec4(color, 1.0);
}
`;

// Star shaders
const starVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const starFragmentShader = /* glsl */ `
${NOISE_GLSL}

uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);

  // Radial gradient — bright core
  float core = exp(-dist * dist * 8.0);
  float corona = exp(-dist * dist * 2.0) * 0.6;

  // Animated surface texture
  vec3 p = vec3(vUv * 2.0, uTime * 0.05);
  float surface = fbm(p * 3.0, 7.0) * 0.5 + 0.5;
  float pulse = 0.9 + 0.1 * sin(uTime * 1.2);

  vec3 coreColor = vec3(1.0, 0.97, 0.88);
  vec3 coronaColor = vec3(1.0, 0.7, 0.2);
  vec3 color = mix(coronaColor, coreColor, core) * (core + corona);
  color += surface * 0.15 * coreColor;
  color *= pulse;

  // Fresnel glow on edges
  float fresnel = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 2.0);
  color += coronaColor * fresnel * 0.8;

  gl_FragColor = vec4(color, 1.0);
}
`;

function Planet({
  radius,
  orbitDistance,
  orbitSpeed,
  index,
}: {
  color: string;
  radius: number;
  orbitDistance: number;
  orbitSpeed: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialAngle = (index * Math.PI * 2) / 3;
  const styleData = PLANET_STYLES[index % PLANET_STYLES.length];

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(styleData.color1) },
      uColor2: { value: new THREE.Color(styleData.color2) },
      uSeed: { value: styleData.seed },
      uStyle: { value: styleData.style },
    }),
    [styleData]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * orbitSpeed + initialAngle;
    meshRef.current.position.x = Math.cos(t) * orbitDistance;
    meshRef.current.position.y = Math.sin(t * 0.3) * (orbitDistance * 0.15);
    meshRef.current.position.z = SYSTEM_CENTER_Z + Math.sin(t) * orbitDistance;
    uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        vertexShader={planetVertexShader}
        fragmentShader={planetFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function Star() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Pulsing glow: scale oscillates subtly
    const pulse = 1.0 + 0.04 * Math.sin(t * 1.2);
    meshRef.current.scale.setScalar(pulse);
    uniforms.uTime.value = t;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, SYSTEM_CENTER_Z]}>
      <sphereGeometry args={[15, 64, 64]} />
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function PlanetarySystem() {
  return (
    <group>
      {/* Central star */}
      <Star />
      <pointLight
        position={[0, 0, SYSTEM_CENTER_Z]}
        intensity={200}
        distance={500}
        color="#fff8e7"
      />
      <ambientLight intensity={0.1} />

      {/* Orbiting planets */}
      {PROJECTS.map((project, i) => (
        <Planet
          key={project.name}
          color={project.color}
          radius={project.planetRadius}
          orbitDistance={project.orbitDistance}
          orbitSpeed={0.08 + i * 0.02}
          index={i}
        />
      ))}
    </group>
  );
}
