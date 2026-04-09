"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Mail, Code2, Globe } from "lucide-react";
import { CONTACT, SECTIONS } from "@/lib/constants";
import Image from "next/image";

const links = [
  {
    icon: Mail,
    href: `mailto:${CONTACT.email}`,
    label: "Envoyer un email",
  },
  {
    icon: Code2,
    href: CONTACT.github,
    label: "Profil GitHub",
  },
  {
    icon: Globe,
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
    [
      SECTIONS.contact.start - 0.05,
      SECTIONS.contact.start,
      SECTIONS.contact.end,
    ],
    [0, 1, 1],
  );

  return (
    <>
      <motion.section
        className="relative h-screen flex flex-col items-center justify-center pointer-events-auto"
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
      </motion.section>

      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col gap-2 items-center justify-center p-4 bg-dark/70 rounded-lg backdrop-blur-sm">
          <Image
            src="/profil.png"
            alt="Paul Klein"
            width={60}
            height={60}
            className="rounded-full"
          />
          <p className="text-text-primary text-sm">
            Conçu par Paul Klein — 2026
          </p>
        </div>
      </div>
    </>
  );
}
