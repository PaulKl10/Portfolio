"use client";

import dynamic from "next/dynamic";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { SCROLL_HEIGHT, SECTIONS } from "@/lib/constants";
import { HeroOverlay } from "@/components/sections/HeroOverlay";
import { ProjectsOverlay } from "@/components/sections/ProjectsOverlay";

const SpaceScene = dynamic(
  () => import("@/components/canvas/SpaceScene"),
  { ssr: false },
);

export default function Home() {
  const { scrollYProgress } = useScrollProgress();

  return (
    <>
      <SpaceScene scrollYProgress={scrollYProgress} />
      <div
        className="relative z-10 pointer-events-none"
        style={{ height: `${SCROLL_HEIGHT}vh` }}
      >
        <HeroOverlay />
        <div style={{ height: `${(SECTIONS.warp.end - SECTIONS.warp.start) * SCROLL_HEIGHT}vh` }} />
        <ProjectsOverlay />
      </div>
    </>
  );
}
