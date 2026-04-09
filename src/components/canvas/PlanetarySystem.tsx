"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PROJECTS, CAMERA_POSITIONS } from "@/lib/constants";

const SYSTEM_CENTER_Z = (CAMERA_POSITIONS.warpEnd + CAMERA_POSITIONS.project3) / 2;

function Planet({
  color,
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

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * orbitSpeed + initialAngle;
    meshRef.current.position.x = Math.cos(t) * orbitDistance;
    meshRef.current.position.y = Math.sin(t * 0.3) * (orbitDistance * 0.15);
    meshRef.current.position.z = SYSTEM_CENTER_Z + Math.sin(t) * orbitDistance;
    meshRef.current.rotation.y += 0.005;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.7}
        metalness={0.3}
      />
    </mesh>
  );
}

export function PlanetarySystem() {
  return (
    <group>
      {/* Central star */}
      <mesh position={[0, 0, SYSTEM_CENTER_Z]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color="#fff8e7" />
      </mesh>
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
