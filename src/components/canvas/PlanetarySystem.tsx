"use client";

import { useRef, useMemo, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PROJECTS, CAMERA_POSITIONS } from "@/lib/constants";

const SYSTEM_CENTER_Z =
  (CAMERA_POSITIONS.warpEnd + CAMERA_POSITIONS.project3) / 2;

const PLANET_STYLES = [
  { color1: "#00d4ff", color2: "#0a2a4a", color3: "#1a5a7a", seed: 1.0, style: 0 },
  { color1: "#ff6b35", color2: "#4a1a0a", color3: "#ff2200", seed: 2.0, style: 1 },
  { color1: "#ffd700", color2: "#8b6914", color3: "#fff5cc", seed: 3.0, style: 2 },
];

// ─── GLSL noise: 3D gradient noise + fBm (5 octaves) ───
const NOISE_GLSL = /* glsl */ `
// Permutation polynomial hash
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // quintic interpolation
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
  for (int i = 0; i < 5; i++) {
    val += amp * noise(p * freq);
    amp *= 0.5;
    freq *= 2.03;
  }
  return val;
}

// Domain-warped fbm for more organic patterns
float warpedFbm(vec3 p, float seed) {
  vec3 q = vec3(fbm(p, seed),
                fbm(p + vec3(5.2, 1.3, 2.8), seed),
                fbm(p + vec3(1.7, 9.2, 3.4), seed));
  return fbm(p + 2.0 * q, seed + 3.0);
}
`;

// ─── Planet shaders ───
const planetVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const planetFragmentShader = /* glsl */ `
${NOISE_GLSL}

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uSeed;
uniform int uStyle;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  float slowTime = uTime * 0.06;

  // Rotate sampling point for surface animation
  float sinT = sin(slowTime);
  float cosT = cos(slowTime);
  vec3 rotP = vec3(
    vPosition.x * cosT - vPosition.z * sinT,
    vPosition.y,
    vPosition.x * sinT + vPosition.z * cosT
  );

  // Domain-warped noise for organic terrain
  float warp = warpedFbm(rotP * 1.5, uSeed);
  float detail = fbm(rotP * 4.0 + vec3(warp * 0.5), uSeed + 7.0);
  float terrain = warp * 0.6 + detail * 0.4;
  float t = clamp(terrain * 0.5 + 0.5, 0.0, 1.0);

  vec3 color = mix(uColor2, uColor1, t);

  // ── Style-specific effects ──
  if (uStyle == 0) {
    // EARTH-LIKE: deep blue oceans, green/brown continents, ice caps, clouds

    // Continent mask from domain-warped noise — larger landmasses
    float continentNoise = warpedFbm(rotP * 1.2, uSeed + 10.0);
    float coastDetail = fbm(rotP * 5.0, uSeed + 15.0) * 0.15;
    float landMask = smoothstep(0.02, 0.12, continentNoise + coastDetail);

    // Ocean: deep to shallow gradient
    vec3 deepOcean = vec3(0.01, 0.04, 0.18);
    vec3 midOcean = vec3(0.02, 0.12, 0.35);
    vec3 shallowOcean = vec3(0.05, 0.25, 0.45);
    float oceanDepth = smoothstep(-0.3, 0.02, continentNoise);
    vec3 oceanColor = mix(deepOcean, midOcean, oceanDepth);
    // Shallow near coasts
    float coastProximity = smoothstep(0.12, 0.02, continentNoise + coastDetail);
    oceanColor = mix(oceanColor, shallowOcean, coastProximity * 0.6);
    // Subtle caustic shimmer
    float caustic = noise(rotP * 10.0 + vec3(uTime * 0.15)) * 0.08;
    oceanColor += vec3(caustic * 0.3, caustic * 0.5, caustic);

    // Land: elevation-based biomes
    float elevation = fbm(rotP * 4.0, uSeed + 20.0) * 0.5 + 0.5;
    float moisture = fbm(rotP * 3.0 + vec3(7.0), uSeed + 25.0) * 0.5 + 0.5;
    vec3 forest = vec3(0.08, 0.28, 0.06);
    vec3 grassland = vec3(0.20, 0.38, 0.08);
    vec3 desert = vec3(0.55, 0.42, 0.22);
    vec3 mountain = vec3(0.35, 0.30, 0.25);
    vec3 snow = vec3(0.90, 0.92, 0.95);

    // Mix biomes based on elevation and moisture
    vec3 lowLand = mix(desert, grassland, moisture);
    vec3 midLand = mix(grassland, forest, moisture);
    vec3 highLand = mix(mountain, snow, smoothstep(0.7, 0.85, elevation));
    vec3 landColor = mix(lowLand, midLand, smoothstep(0.3, 0.5, elevation));
    landColor = mix(landColor, highLand, smoothstep(0.55, 0.75, elevation));

    color = mix(oceanColor, landColor, landMask);

    // Polar ice caps with irregular edges
    float polar = abs(normalize(vPosition).y);
    float iceNoise = fbm(rotP * 4.0, uSeed + 30.0) * 0.05;
    float ice = smoothstep(0.85 + iceNoise, 0.92 + iceNoise, polar);
    color = mix(color, vec3(0.88, 0.93, 0.98), ice * 0.9);

    // Cloud layer — separate rotation for realism
    vec3 cloudP = rotP + vec3(uTime * 0.04, 0.0, uTime * 0.025);
    float cloud1 = fbm(cloudP * 2.5, uSeed + 50.0);
    float cloud2 = fbm(cloudP * 5.0, uSeed + 55.0);
    float cloudMask = smoothstep(0.05, 0.35, cloud1) * (0.7 + 0.3 * cloud2);
    // Thinner clouds near equator, thicker at mid-latitudes
    float latBand = smoothstep(0.0, 0.3, abs(vPosition.y)) * smoothstep(0.8, 0.5, abs(vPosition.y));
    cloudMask *= 0.5 + latBand * 0.5;
    color = mix(color, vec3(1.0, 1.0, 1.0), cloudMask * 0.45);

  } else if (uStyle == 1) {
    // VOLCANIC WORLD: cracked crust, lava rivers, eruption glow

    // Base darkened crust
    float crustNoise = fbm(rotP * 3.5, uSeed + 20.0);
    vec3 darkCrust = uColor2 * 0.4;
    vec3 lightCrust = uColor2 * 0.9;
    color = mix(darkCrust, lightCrust, crustNoise * 0.5 + 0.5);

    // Lava cracks — sharp ridges from domain warping
    float crack1 = warpedFbm(rotP * 4.0 + vec3(slowTime * 0.2), uSeed + 25.0);
    float crack2 = fbm(rotP * 8.0, uSeed + 30.0);
    float crackIntensity = smoothstep(0.45, 0.55, crack1) * smoothstep(0.3, 0.5, crack2);

    // Pulsing lava glow
    float pulse = 0.8 + 0.2 * sin(uTime * 1.5 + crack1 * 6.28);
    vec3 lavaColor = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.8, 0.0), crackIntensity) * 2.0 * pulse;
    color = mix(color, lavaColor, crackIntensity * 0.9);

    // Hotspot eruptions
    float hotspot = fbm(rotP * 2.0 + vec3(0.0, uTime * 0.1, 0.0), uSeed + 40.0);
    float eruption = smoothstep(0.55, 0.7, hotspot);
    color += uColor3 * eruption * 0.6 * (0.7 + 0.3 * sin(uTime * 3.0));

    // Smoke/ash near eruptions
    float smoke = fbm(rotP * 5.0 + vec3(uTime * 0.05), uSeed + 45.0);
    color = mix(color, vec3(0.15, 0.1, 0.08), eruption * smoke * 0.4);

  } else {
    // MARBLE/GOLDEN WORLD: layered veins, subsurface shimmer, clouds

    // Layered marble veins
    float vein1 = abs(sin(terrain * 10.0 + detail * 6.0));
    float vein2 = abs(sin(terrain * 20.0 + warp * 8.0));
    float veins = vein1 * 0.6 + vein2 * 0.4;
    veins = pow(veins, 0.6);

    // Subsurface shimmer
    float shimmer = 0.5 + 0.5 * sin(uTime * 1.2 + terrain * 3.14 + vUv.x * 10.0);
    vec3 highlight = uColor3;
    color = mix(color, highlight, veins * 0.5 * shimmer);

    // Deep veins with dark valleys
    float deepVein = smoothstep(0.0, 0.15, vein1);
    color = mix(uColor2 * 0.5, color, deepVein);

    // Golden specular sparkle
    float sparkle = noise(rotP * 15.0 + vec3(uTime * 0.3));
    sparkle = pow(max(sparkle, 0.0), 8.0);
    color += uColor1 * sparkle * 0.4;

    // Thin haze layer
    float haze = fbm(rotP * 2.0 + vec3(uTime * 0.02, 0.0, 0.0), uSeed + 60.0);
    color = mix(color, uColor1 * 0.8, smoothstep(0.2, 0.5, haze) * 0.15);
  }

  // ── Atmosphere fresnel rim ──
  float fresnel = pow(1.0 - clamp(dot(vWorldNormal, vViewDir), 0.0, 1.0), 4.0);
  vec3 atmosColor = uColor1 * 1.5;
  // Outer glow fade
  float atmosGlow = fresnel * 0.7;
  color = mix(color, atmosColor, atmosGlow);

  // ── Lighting ──
  vec3 lightDir = normalize(vec3(1.0, 0.3, 0.8));
  float NdotL = dot(vNormal, lightDir);

  // Diffuse with soft wrap lighting
  float diffuse = clamp(NdotL * 0.5 + 0.5, 0.0, 1.0);
  diffuse = pow(diffuse, 1.3);

  // Specular highlight
  vec3 halfDir = normalize(lightDir + vViewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);

  // Night side subtle glow (city lights / volcanic glow)
  float nightSide = smoothstep(0.0, -0.2, NdotL);
  vec3 nightGlow = vec3(0.0);
  if (uStyle == 1) {
    nightGlow = vec3(0.8, 0.15, 0.0) * nightSide * 0.3;
  } else if (uStyle == 0) {
    float cityNoise = fbm(rotP * 12.0, uSeed + 70.0);
    nightGlow = uColor1 * 0.15 * nightSide * smoothstep(0.3, 0.6, cityNoise);
  }

  color = color * (0.15 + 0.85 * diffuse) + spec * 0.3 + nightGlow;

  gl_FragColor = vec4(color, 1.0);
}
`;

// ─── Star shaders ───
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

  // Core glow
  float core = exp(-dist * dist * 10.0);
  float corona = exp(-dist * dist * 2.5) * 0.5;

  // Animated plasma surface
  vec3 p = vec3(vUv * 3.0, uTime * 0.08);
  float plasma1 = fbm(p, 7.0);
  float plasma2 = fbm(p * 2.0 + vec3(uTime * 0.05), 12.0);
  float surface = plasma1 * 0.6 + plasma2 * 0.4;

  float pulse = 0.92 + 0.08 * sin(uTime * 1.0);

  // Color gradient: white core → yellow → orange corona
  vec3 coreColor = vec3(1.0, 0.98, 0.92);
  vec3 midColor = vec3(1.0, 0.85, 0.4);
  vec3 coronaColor = vec3(1.0, 0.5, 0.1);

  vec3 color = mix(coronaColor, midColor, smoothstep(0.3, 0.15, dist));
  color = mix(color, coreColor, core);
  color *= (core + corona);

  // Surface texture with brighter granulation
  float granulation = surface * 0.5 + 0.5;
  color += granulation * 0.12 * coreColor;
  color *= pulse;

  // Solar prominences
  float prom = fbm(vec3(vUv * 5.0, uTime * 0.15), 20.0);
  float promMask = smoothstep(0.35, 0.5, dist) * smoothstep(0.6, 0.45, dist);
  color += coronaColor * prom * promMask * 0.5;

  // Fresnel edge glow
  float fresnel = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 2.5);
  color += coronaColor * fresnel * 0.6;

  gl_FragColor = vec4(color, 1.0);
}
`;

// ─── Ring shaders ───
const ringVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ringFragmentShader = /* glsl */ `
${NOISE_GLSL}

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uTime;
uniform float uInnerRadius;
uniform float uOuterRadius;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  // Radial distance from center (0 = inner edge, 1 = outer edge)
  float r = (length(vUv - 0.5) * 2.0);
  float radialT = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);

  // Discard pixels outside the ring
  if (radialT < 0.0 || radialT > 1.0) discard;

  // Concentric bands using sine waves at different frequencies
  float band1 = sin(radialT * 40.0) * 0.5 + 0.5;
  float band2 = sin(radialT * 80.0 + 1.5) * 0.5 + 0.5;
  float band3 = sin(radialT * 160.0 + 3.0) * 0.5 + 0.5;
  float bands = band1 * 0.5 + band2 * 0.3 + band3 * 0.2;

  // Noise for irregularity
  float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float n = noise(vec3(radialT * 10.0, angle * 2.0, uTime * 0.02)) * 0.3;
  bands = clamp(bands + n, 0.0, 1.0);

  // Color
  vec3 color = mix(uColor2, uColor1, bands);

  // Gaps in the rings (Cassini division style)
  float gap1 = smoothstep(0.42, 0.44, radialT) * smoothstep(0.48, 0.46, radialT);
  float gap2 = smoothstep(0.70, 0.71, radialT) * smoothstep(0.74, 0.73, radialT);

  // Alpha: fade edges + band density + gaps
  float edgeFade = smoothstep(0.0, 0.08, radialT) * smoothstep(1.0, 0.92, radialT);
  float alpha = edgeFade * (0.3 + bands * 0.5) * (1.0 - gap1 * 0.8) * (1.0 - gap2 * 0.6);

  // Subtle shimmer
  float shimmer = 0.9 + 0.1 * sin(uTime * 0.8 + radialT * 20.0);
  color *= shimmer;

  gl_FragColor = vec4(color, alpha);
}
`;

// ─── Components ───

function PlanetRings({
  radius,
  color1,
  color2,
  time,
}: {
  radius: number;
  color1: string;
  color2: string;
  time: RefObject<number>;
}) {
  const innerRadius = radius * 1.4;
  const outerRadius = radius * 2.6;

  const uniforms = useMemo(
    () => ({
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uTime: { value: 0 },
      uInnerRadius: { value: innerRadius / (outerRadius * 2) + 0.5 },
      uOuterRadius: { value: 0.5 + 0.5 },
    }),
    [color1, color2, innerRadius, outerRadius],
  );

  useFrame(() => {
    uniforms.uTime.value = time.current;
  });

  return (
    <mesh rotation={[Math.PI * 0.35, 0.2, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <shaderMaterial
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function Planet({
  radius,
  orbitDistance,
  orbitSpeed,
  index,
  hasRings,
}: {
  color: string;
  radius: number;
  orbitDistance: number;
  orbitSpeed: number;
  index: number;
  hasRings?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const initialAngle = (index * Math.PI * 2) / 3;
  const styleData = PLANET_STYLES[index % PLANET_STYLES.length];

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(styleData.color1) },
      uColor2: { value: new THREE.Color(styleData.color2) },
      uColor3: { value: new THREE.Color(styleData.color3) },
      uSeed: { value: styleData.seed },
      uStyle: { value: styleData.style },
    }),
    [styleData],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * orbitSpeed + initialAngle;
    groupRef.current.position.x = Math.cos(t) * orbitDistance;
    groupRef.current.position.y = Math.sin(t * 0.3) * (orbitDistance * 0.15);
    groupRef.current.position.z = SYSTEM_CENTER_Z + Math.sin(t) * orbitDistance;
    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    timeRef.current = elapsed;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      {hasRings && (
        <PlanetRings
          radius={radius}
          color1={styleData.color1}
          color2={styleData.color2}
          time={timeRef}
        />
      )}
    </group>
  );
}

function Star() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
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
      <Star />
      <pointLight
        position={[0, 0, SYSTEM_CENTER_Z]}
        intensity={200}
        distance={500}
        color="#fff8e7"
      />
      <ambientLight intensity={0.1} />

      {PROJECTS.map((project, i) => (
        <Planet
          key={project.name}
          color={project.color}
          radius={project.planetRadius}
          orbitDistance={project.orbitDistance}
          orbitSpeed={0.08 + i * 0.02}
          index={i}
          hasRings={i === 2}
        />
      ))}
    </group>
  );
}
