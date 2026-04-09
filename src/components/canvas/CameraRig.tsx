"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_POSITIONS } from "@/lib/constants";

interface CameraRigProps {
  scrollProgress: React.MutableRefObject<number>;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}

export function CameraRig({ scrollProgress, mousePosition }: CameraRigProps) {
  const { camera } = useThree();
  const targetZ = useRef(0);
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);

  useFrame(() => {
    const progress = scrollProgress.current;

    // Map scroll progress (0-1) to camera Z position
    const { heroStart, contactEnd } = CAMERA_POSITIONS;
    const z = THREE.MathUtils.lerp(heroStart, contactEnd, progress);
    targetZ.current = z;

    // Mouse parallax (only in hero section, progress < 0.14)
    if (progress < 0.14) {
      targetRotX.current = mousePosition.current.y * 0.02;
      targetRotY.current = mousePosition.current.x * 0.02;
    } else {
      targetRotX.current = 0;
      targetRotY.current = 0;
    }

    // Lerp camera position and rotation
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      targetZ.current,
      0.05,
    );
    camera.rotation.x = THREE.MathUtils.lerp(
      camera.rotation.x,
      targetRotX.current,
      0.05,
    );
    camera.rotation.y = THREE.MathUtils.lerp(
      camera.rotation.y,
      targetRotY.current,
      0.05,
    );
  });

  return null;
}
