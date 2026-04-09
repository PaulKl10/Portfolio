"use client";

import dynamic from "next/dynamic";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { SCROLL_HEIGHT, SECTIONS } from "@/lib/constants";
import { HeroOverlay } from "@/components/sections/HeroOverlay";
import { ProjectsOverlay } from "@/components/sections/ProjectsOverlay";
import { SkillsOverlay } from "@/components/sections/SkillsOverlay";
import { ParcoursOverlay } from "@/components/sections/ParcoursOverlay";
import { ContactOverlay } from "@/components/sections/ContactOverlay";
import { AudioToggle } from "@/components/AudioToggle";
import SmokeyCursor from "@/components/ui/smokey-cursor";

const SpaceScene = dynamic(
  () => import("@/components/canvas/SpaceScene"),
  { ssr: false },
);

export default function Home() {
  const { scrollYProgress } = useScrollProgress();

  return (
    <>
      <SpaceScene scrollYProgress={scrollYProgress} />
      <SmokeyCursor
        densityDissipation={4}
        velocityDissipation={3}
        splatRadius={0.1}
        splatForce={2000}
        curl={5}
        pressureIterations={10}
        colorUpdateSpeed={5}
      />
      <AudioToggle />
      <div
        className="relative z-10 pointer-events-none"
        style={{ height: `${SCROLL_HEIGHT}vh` }}
      >
        <HeroOverlay />
        <div style={{ height: `${(SECTIONS.warp.end - SECTIONS.warp.start) * SCROLL_HEIGHT}vh` }} />
        <ProjectsOverlay />
        <div style={{ height: `${(SECTIONS.nebula.start - SECTIONS.projects.end) * SCROLL_HEIGHT}vh` }} aria-hidden="true" />
        <SkillsOverlay />
        <ParcoursOverlay />
        <ContactOverlay />
      </div>
    </>
  );
}
