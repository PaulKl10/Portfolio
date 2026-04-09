"use client";

import dynamic from "next/dynamic";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { SCROLL_HEIGHT, SECTIONS } from "@/lib/constants";
import { HeroOverlay } from "@/components/sections/HeroOverlay";
import { ProjectsOverlay } from "@/components/sections/ProjectsOverlay";
import { SkillsOverlay } from "@/components/sections/SkillsOverlay";

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
        <div style={{ height: `${(SECTIONS.nebula.start - SECTIONS.projects.end) * SCROLL_HEIGHT}vh` }} aria-hidden="true" />
        <SkillsOverlay />
      </div>
    </>
  );
}
