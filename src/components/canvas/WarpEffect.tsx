"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS } from "@/lib/constants";

const WARP_STAR_COUNT = 300;

const vertexShader = `
  attribute float aOffset;
  uniform float uStretch;
  uniform float uCameraZ;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Stretch stars along Z based on warp intensity
    pos.z += aOffset * uStretch * 20.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vAlpha = smoothstep(0.0, 0.3, uStretch);
    gl_PointSize = mix(1.0, 3.0, uStretch) * (150.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    // Elongated shape for streak effect
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(0.8, 0.9, 1.0, alpha);
  }
`;

interface WarpEffectProps {
  scrollProgress: React.MutableRefObject<number>;
}

export function WarpEffect({ scrollProgress }: WarpEffectProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const flashRef = useRef<THREE.Mesh>(null);

  const { positions, offsets } = useMemo(() => {
    const pos = new Float32Array(WARP_STAR_COUNT * 3);
    const off = new Float32Array(WARP_STAR_COUNT);
    for (let i = 0; i < WARP_STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 2] = 50 + Math.random() * 150; // in warp zone
      off[i] = Math.random();
    }
    return { positions: pos, offsets: off };
  }, []);

  useFrame(({ camera }) => {
    const progress = scrollProgress.current;
    const warpStart = SECTIONS.warp.start;
    const warpEnd = SECTIONS.warp.end;

    // Warp intensity: 0 outside warp zone, 0-1 during warp
    let stretch = 0;
    if (progress >= warpStart && progress <= warpEnd) {
      stretch = (progress - warpStart) / (warpEnd - warpStart);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uStretch.value = stretch;
      materialRef.current.uniforms.uCameraZ.value = camera.position.z;
    }

    // White flash at end of warp
    if (flashRef.current) {
      const flashProgress = Math.max(0, (stretch - 0.7) / 0.3); // last 30%
      const flashOpacity =
        flashProgress > 0 ? Math.sin(flashProgress * Math.PI) * 0.3 : 0;
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity =
        flashOpacity;
      flashRef.current.position.z = camera.position.z + 5;
    }
  });

  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
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
            uStretch: { value: 0 },
            uCameraZ: { value: 0 },
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* White flash plane */}
      <mesh ref={flashRef}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
