"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const nameLetters = "Paul Klein".split("");

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.3 },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function HeroOverlay() {
  return (
    <section
      className="relative h-[100vh] flex flex-col items-center justify-center pointer-events-auto"
      aria-label="Accueil"
    >
      <motion.h1
        className="text-5xl sm:text-6xl md:text-7xl font-bold text-glow flex"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {nameLetters.map((letter, i) => (
          <motion.span
            key={i}
            variants={letterVariants}
            className={letter === " " ? "w-4" : ""}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        className="mt-4 text-lg sm:text-xl text-text-secondary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        Développeur Full-Stack
      </motion.p>

      <motion.div
        className="absolute bottom-12"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <ChevronDown className="w-8 h-8 text-pulsar-blue opacity-60" />
      </motion.div>
    </section>
  );
}
