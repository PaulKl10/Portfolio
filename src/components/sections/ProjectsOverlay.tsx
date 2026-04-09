"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Github, ExternalLink } from "lucide-react";
import { PROJECTS, SECTIONS, SCROLL_HEIGHT } from "@/lib/constants";
import { useRef } from "react";

function ProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll();

  const projectProgress = SECTIONS.projects.start +
    ((SECTIONS.projects.end - SECTIONS.projects.start) * (index + 0.3)) /
      PROJECTS.length;

  const opacity = useTransform(
    scrollYProgress,
    [projectProgress - 0.02, projectProgress, projectProgress + 0.08, SECTIONS.projects.end],
    [0, 1, 1, 0],
  );
  const scale = useTransform(
    scrollYProgress,
    [projectProgress - 0.02, projectProgress],
    [0.8, 1],
  );

  return (
    <motion.div
      ref={ref}
      className="glass p-6 sm:p-8 max-w-md w-full pointer-events-auto"
      style={{
        opacity,
        scale,
        boxShadow: `0 0 30px ${project.color}20, 0 0 60px ${project.color}10`,
        borderColor: `${project.color}30`,
      }}
    >
      <h3 className="text-xl font-bold mb-2" style={{ color: project.color }}>
        {project.name}
      </h3>
      <p className="text-text-secondary text-sm mb-4">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="text-xs font-mono px-2 py-1 rounded-full bg-white/5 text-text-secondary"
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
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          aria-label={`Code source de ${project.name} sur GitHub`}
        >
          <Github className="w-5 h-5" />
        </a>
        <a
          href={project.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          aria-label={`Démo live de ${project.name}`}
        >
          <ExternalLink className="w-5 h-5" />
        </a>
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
