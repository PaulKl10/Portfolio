"use client";

import { useScroll, useTransform, MotionValue } from "framer-motion";

export function useScrollProgress(): {
  scrollYProgress: MotionValue<number>;
} {
  const { scrollYProgress } = useScroll();
  return { scrollYProgress };
}

export function useSectionProgress(
  scrollYProgress: MotionValue<number>,
  start: number,
  end: number,
): MotionValue<number> {
  return useTransform(scrollYProgress, [start, end], [0, 1]);
}
