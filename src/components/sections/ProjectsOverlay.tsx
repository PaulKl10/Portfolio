"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Code2, ExternalLink } from "lucide-react";
import { PROJECTS, SECTIONS, SCROLL_HEIGHT } from "@/lib/constants";
import { useRef } from "react";
import Image from "next/image";

function ProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll();

  const sectionLength = SECTIONS.projects.end - SECTIONS.projects.start;
  const cardSlice = sectionLength / PROJECTS.length;
  const cardStart = SECTIONS.projects.start + cardSlice * index;
  const cardEnd = cardStart + cardSlice;

  const opacity = useTransform(
    scrollYProgress,
    [cardStart, cardStart + 0.02, cardEnd - 0.04, cardEnd],
    [0, 1, 1, 0],
  );
  const scale = useTransform(
    scrollYProgress,
    [cardStart, cardStart + 0.02],
    [0.8, 1],
  );

  return (
    <motion.div
      ref={ref}
      className="relative max-w-sm md:max-w-2xl w-full pointer-events-auto rounded-2xl overflow-hidden"
      style={{
        opacity,
        scale,
        boxShadow: `0 0 30px ${project.color}20, 0 0 60px ${project.color}10`,
        border: `1px solid ${project.color}30`,
      }}
    >
      {/* Screenshot background */}
      <div className="absolute inset-0">
        <Image
          src={project.screenshot}
          alt={`Capture d'écran de ${project.name}`}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, 672px"
        />
        {/* Dark overlay gradient for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${project.color}15 0%, rgba(5,5,16,0.85) 80%, rgba(5,5,16,1) 100%)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end min-h-[360px]">
        <h3 className="text-xl font-bold mb-2" style={{ color: project.color }}>
          {project.name}
        </h3>
        <p className="text-text-primary text-sm mb-4 drop-shadow-lg">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="text-xs font-mono px-2 py-1 rounded-full text-text-primary"
              style={{ background: `${project.color}20`, border: `1px solid ${project.color}30` }}
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
            aria-label={`Code source de ${project.name} sur GitHub`}
          >
            <Code2 className="w-5 h-5" />
          </a>
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
            aria-label={`Démo live de ${project.name}`}
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectsOverlay() {
  return (
    <section
      className="relative flex flex-col items-center justify-around"
      style={{ height: `${(SECTIONS.projects.end - SECTIONS.projects.start) * SCROLL_HEIGHT}vh` }}
      aria-label="Projets"
    >
      {PROJECTS.map((project, i) => (
        <div
          key={project.name}
          className={`flex w-full justify-center ${i % 2 === 0 ? "sm:justify-start sm:pl-16 lg:pl-32" : "sm:justify-end sm:pr-16 lg:pr-32"}`}
        >
          <ProjectCard project={project} index={i} />
        </div>
      ))}
    </section>
  );
}
