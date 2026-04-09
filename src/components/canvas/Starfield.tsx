"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 2000;
const SPHERE_RADIUS = 500;

const vertexShader = `
  attribute float aSize;
  attribute float aOffset;
  uniform float uTime;
  varying float vOpacity;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = sin(uTime * 2.0 + aOffset * 6.2831) * 0.3 + 0.7;
    vOpacity = twinkle;
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
    gl_FragColor = vec4(vec3(0.95, 0.95, 1.0), alpha);
  }
`;

export function Starfield() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, offsets } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    const off = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * SPHERE_RADIUS;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = Math.random() * 1400 - 200; // spread along Z

      sz[i] = Math.random() * 1.5 + 0.5;
      off[i] = Math.random();
    }
    return { positions: pos, sizes: sz, offsets: off };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute
          attach="attributes-aOffset"
          args={[offsets, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
