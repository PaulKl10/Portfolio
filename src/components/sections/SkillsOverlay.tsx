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

  const scale = useTransform(
    scrollYProgress,
    [entryPoint - 0.01, entryPoint + 0.02],
    [0.6, 1],
  );

  return (
    <motion.span
      className="pointer-events-auto px-5 py-2.5 font-mono text-sm font-semibold cursor-default select-none rounded-full relative"
      style={{
        opacity,
        scale,
        color: skill.color,
        background: `linear-gradient(135deg, ${skill.color}18, ${skill.color}08)`,
        border: `1px solid ${skill.color}50`,
        boxShadow: `
          0 0 20px ${skill.color}30,
          0 0 40px ${skill.color}15,
          inset 0 0 20px ${skill.color}10
        `,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        textShadow: `0 0 12px ${skill.color}80`,
      }}
      whileHover={{
        scale: 1.15,
        boxShadow: `
          0 0 30px ${skill.color}50,
          0 0 60px ${skill.color}30,
          0 0 90px ${skill.color}15,
          inset 0 0 30px ${skill.color}20
        `,
      }}
      animate={{
        y: [0, -6, 0],
      }}
      transition={{
        y: {
          repeat: Infinity,
          duration: 3 + index * 0.2,
          ease: "easeInOut",
        },
        scale: { type: "spring", stiffness: 300 },
        boxShadow: { duration: 0.3 },
      }}
    >
      <span className="relative z-10">{skill.name}</span>
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
      <motion.h2
        className="absolute top-1/4 text-2xl sm:text-3xl font-bold text-glow"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Technologies
      </motion.h2>
      <div className="flex flex-wrap justify-center gap-5 max-w-3xl">
        {SKILLS.map((skill, i) => (
          <SkillBadge key={skill.name} skill={skill} index={i} />
        ))}
      </div>
    </section>
  );
}
