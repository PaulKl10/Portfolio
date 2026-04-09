"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_POSITIONS, SKILLS } from "@/lib/constants";

const BG_PARTICLE_COUNT = 500;
const NEBULA_CENTER_Z =
  (CAMERA_POSITIONS.nebulaStart + CAMERA_POSITIONS.nebulaEnd) / 2;
const NEBULA_SPREAD = 150;

const bgVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Brownian-ish drift
    pos.x += sin(uTime * 0.3 + position.z * 0.1) * 2.0;
    pos.y += cos(uTime * 0.2 + position.x * 0.1) * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vColor = aColor;
    vAlpha = 0.15 + 0.1 * sin(uTime + position.x);
    gl_PointSize = aSize * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const bgFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function Nebula() {
  const bgMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const bgData = useMemo(() => {
    const positions = new Float32Array(BG_PARTICLE_COUNT * 3);
    const sizes = new Float32Array(BG_PARTICLE_COUNT);
    const colors = new Float32Array(BG_PARTICLE_COUNT * 3);

    const purple = new THREE.Color("#a855f7");
    const blue = new THREE.Color("#00d4ff");

    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * NEBULA_SPREAD * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * NEBULA_SPREAD * 2;
      positions[i * 3 + 2] =
        NEBULA_CENTER_Z + (Math.random() - 0.5) * NEBULA_SPREAD * 2;

      sizes[i] = Math.random() * 2.5 + 0.5;

      const mix = Math.random();
      const color = purple.clone().lerp(blue, mix);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, sizes, colors };
  }, []);

  // Skill particles — larger, brighter, spread organically
  const skillData = useMemo(() => {
    const positions = new Float32Array(SKILLS.length * 3);
    const colors = new Float32Array(SKILLS.length * 3);
    const sizes = new Float32Array(SKILLS.length);

    SKILLS.forEach((skill, i) => {
      const angle = (i / SKILLS.length) * Math.PI * 2;
      const radius = 30 + Math.random() * 50;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] =
        Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] =
        NEBULA_CENTER_Z + (Math.random() - 0.5) * 60;

      const c = new THREE.Color(skill.color);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 6 + Math.random() * 2;
    });

    return { positions, colors, sizes };
  }, []);

  useFrame(({ clock }) => {
    if (bgMaterialRef.current) {
      bgMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group>
      {/* Background nebula particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[bgData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[bgData.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[bgData.colors, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={bgMaterialRef}
          vertexShader={bgVertexShader}
          fragmentShader={bgFragmentShader}
          uniforms={{ uTime: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Skill particles — brighter, larger */}
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
          vertexShader={bgVertexShader}
          fragmentShader={bgFragmentShader.replace(
            "vAlpha;",
            "vAlpha; vAlpha = vAlpha * 3.0;",
          )}
          uniforms={{ uTime: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
