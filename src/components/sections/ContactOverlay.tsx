"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Mail, Github, Linkedin } from "lucide-react";
import { CONTACT, SECTIONS } from "@/lib/constants";

const links = [
  {
    icon: Mail,
    href: `mailto:${CONTACT.email}`,
    label: "Envoyer un email",
  },
  {
    icon: Github,
    href: CONTACT.github,
    label: "Profil GitHub",
  },
  {
    icon: Linkedin,
    href: CONTACT.linkedin,
    label: "Profil LinkedIn",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function ContactOverlay() {
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(
    scrollYProgress,
    [SECTIONS.contact.start, SECTIONS.contact.start + 0.03],
    [0, 1],
  );

  return (
    <motion.section
      className="relative h-[100vh] flex flex-col items-center justify-center pointer-events-auto"
      style={{ opacity }}
      aria-label="Contact"
    >
      <motion.h2
        className="text-3xl sm:text-4xl font-bold text-glow mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Restons en contact
      </motion.h2>

      <motion.div
        className="flex gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {links.map(({ icon: Icon, href, label }) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="glass p-4 hover:bg-white/10 transition-colors"
            variants={itemVariants}
            whileHover={{ scale: 1.1 }}
            aria-label={label}
          >
            <Icon className="w-6 h-6 text-pulsar-blue" />
          </motion.a>
        ))}
      </motion.div>

      <p className="absolute bottom-8 text-text-secondary text-sm">
        Conçu par Paul Klein — 2026
      </p>
    </motion.section>
  );
}
