"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { SKILLS, SECTIONS, SCROLL_HEIGHT } from "@/lib/constants";

function SkillBadge({
  skill,
  index,
}: {
  skill: (typeof SKILLS)[number];
  index: number;
}) {
  const { scrollYProgress } = useScroll();

  const entryPoint =
    SECTIONS.nebula.start +
    ((SECTIONS.nebula.end - SECTIONS.nebula.start) * 0.1 * (index + 1)) /
      SKILLS.length;

  const opacity = useTransform(
    scrollYProgress,
    [entryPoint - 0.01, entryPoint + 0.02, SECTIONS.contact.start - 0.02, SECTIONS.contact.start],
    [0, 1, 1, 0],
  );

  return (
    <motion.span
      className="glass pointer-events-auto px-4 py-2 font-mono text-sm cursor-default select-none"
      style={{
        opacity,
        boxShadow: `0 0 15px ${skill.color}40, 0 0 30px ${skill.color}20`,
        borderColor: `${skill.color}40`,
        color: skill.color,
      }}
      whileHover={{ scale: 1.1 }}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        y: {
          repeat: Infinity,
          duration: 3 + index * 0.2,
          ease: "easeInOut",
        },
      }}
    >
      {skill.name}
    </motion.span>
  );
}

export function SkillsOverlay() {
  return (
    <section
      className="relative flex items-center justify-center"
      style={{
        height: `${(SECTIONS.nebula.end - SECTIONS.nebula.start) * SCROLL_HEIGHT}vh`,
      }}
      aria-label="Compétences"
    >
      <div className="flex flex-wrap justify-center gap-4 max-w-2xl px-4">
        {SKILLS.map((skill, i) => (
          <SkillBadge key={skill.name} skill={skill} index={i} />
        ))}
      </div>
    </section>
  );
}
