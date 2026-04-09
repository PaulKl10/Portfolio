"use client";

import dynamic from "next/dynamic";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { SCROLL_HEIGHT } from "@/lib/constants";
import { HeroOverlay } from "@/components/sections/HeroOverlay";

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
      </div>
    </>
  );
}
