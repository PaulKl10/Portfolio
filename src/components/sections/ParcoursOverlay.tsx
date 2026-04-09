"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Briefcase, GraduationCap } from "lucide-react";
import { SECTIONS, SCROLL_HEIGHT, EXPERIENCES, FORMATIONS } from "@/lib/constants";

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const itemVariantsRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

export function ParcoursOverlay() {
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(
    scrollYProgress,
    [SECTIONS.parcours.start - 0.03, SECTIONS.parcours.start, SECTIONS.parcours.end - 0.02, SECTIONS.parcours.end],
    [0, 1, 1, 0],
  );

  return (
    <motion.section
      className="relative flex flex-col items-center justify-center pointer-events-auto py-20"
      style={{
        height: `${(SECTIONS.parcours.end - SECTIONS.parcours.start) * SCROLL_HEIGHT}vh`,
        opacity,
      }}
      aria-label="Parcours"
    >
      <motion.h2
        className="text-3xl sm:text-4xl font-bold text-glow mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Parcours
      </motion.h2>

      <div className="w-full max-w-4xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        {/* Expériences */}
        <div>
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Briefcase className="w-5 h-5 text-pulsar-blue" />
            <h3 className="text-xl font-semibold text-pulsar-blue">Expériences</h3>
          </motion.div>

          <div className="relative pl-6 border-l border-white/10">
            {EXPERIENCES.map((exp) => (
              <motion.div
                key={`${exp.company}-${exp.role}`}
                className="relative mb-8 last:mb-0"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {/* Timeline dot */}
                <div className="absolute -left-[calc(1.5rem+4.5px)] top-1.5 w-[9px] h-[9px] rounded-full bg-pulsar-blue shadow-[0_0_8px_rgba(0,212,255,0.6)]" />

                <div className="glass p-4">
                  <p className="text-text-primary font-medium">{exp.role}</p>
                  <p className="text-pulsar-blue text-sm mt-1">{exp.company}</p>
                  <p className="text-text-secondary text-xs mt-1">
                    {exp.period} — {exp.location}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Formations */}
        <div>
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <GraduationCap className="w-5 h-5 text-nebula-purple" />
            <h3 className="text-xl font-semibold text-nebula-purple">Formations</h3>
          </motion.div>

          <div className="relative pl-6 border-l border-white/10">
            {FORMATIONS.map((formation) => (
              <motion.div
                key={formation.school}
                className="relative mb-8 last:mb-0"
                variants={itemVariantsRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {/* Timeline dot */}
                <div className="absolute -left-[calc(1.5rem+4.5px)] top-1.5 w-[9px] h-[9px] rounded-full bg-nebula-purple shadow-[0_0_8px_rgba(168,85,247,0.6)]" />

                <div className="glass p-4">
                  <p className="text-text-primary font-medium">{formation.diploma}</p>
                  <p className="text-nebula-purple text-sm mt-1">{formation.school}</p>
                  <p className="text-text-secondary text-xs mt-1">{formation.period}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
