"use client";

import { useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { CameraRig } from "./CameraRig";
import { Starfield } from "./Starfield";
import { WarpEffect } from "./WarpEffect";

interface SpaceSceneProps {
  scrollYProgress: MotionValue<number>;
}

export default function SpaceScene({ scrollYProgress }: SpaceSceneProps) {
  const scrollProgress = useRef(0);
  const mousePosition = useRef({ x: 0, y: 0 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgress.current = v;
  });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      mousePosition.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    },
    [],
  );

  return (
    <div
      className="fixed inset-0 z-0"
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 2000 }}
        gl={{ antialias: false, alpha: false }}
      >
        <color attach="background" args={["#050510"]} />
        <CameraRig
          scrollProgress={scrollProgress}
          mousePosition={mousePosition}
        />
        <Starfield scrollProgress={scrollProgress} />
        <WarpEffect scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
