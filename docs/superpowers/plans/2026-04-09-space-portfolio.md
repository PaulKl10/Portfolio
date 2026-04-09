# Space Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an immersive space-themed portfolio SPA with Three.js/R3F where scrolling pilots a camera through a 3D galaxy.

**Architecture:** A fixed full-screen R3F canvas renders the 3D scene (starfield, planets, nebula). HTML overlay content scrolls on top with glassmorphism cards. A shared scroll progress value (Framer Motion `useScroll`) drives both the 3D camera position (via lerping) and the HTML section animations. All R3F components are client-only (`dynamic` with `ssr: false`).

**Tech Stack:** Next.js 16, React 19, Three.js, @react-three/fiber, @react-three/drei, Framer Motion, Tailwind CSS v4, Lucide React

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata, dark bg)
│   ├── page.tsx                # Assembles SpaceScene + overlay sections
│   └── globals.css             # Tailwind v4 + custom CSS variables + glassmorphism utilities
├── components/
│   ├── canvas/
│   │   ├── SpaceScene.tsx      # "use client" — Canvas wrapper, dynamic import with ssr:false
│   │   ├── Starfield.tsx       # Points geometry, 2000 stars, twinkle shader
│   │   ├── WarpEffect.tsx      # Stretches stars on Z axis based on scroll
│   │   ├── PlanetarySystem.tsx # Central star + 3 orbiting planets
│   │   ├── Nebula.tsx          # 500 background particles + 10 skill particles
│   │   └── CameraRig.tsx       # Lerped camera position driven by scroll
│   ├── sections/
│   │   ├── HeroOverlay.tsx     # "use client" — Name + tagline + scroll arrow
│   │   ├── ProjectsOverlay.tsx # "use client" — 3 project cards with glassmorphism
│   │   ├── SkillsOverlay.tsx   # "use client" — Floating skill badges
│   │   └── ContactOverlay.tsx  # "use client" — Contact links
│   └── AudioToggle.tsx         # "use client" — Sound on/off button
├── hooks/
│   └── useScrollProgress.ts    # Framer Motion useScroll wrapper returning 0-1 progress
└── lib/
    └── constants.ts            # Project data, skills, colors, scroll anchors
```

---

### Task 1: Install Dependencies & Configure Base Styles

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install all dependencies**

```bash
npm install three @react-three/fiber @react-three/drei framer-motion lucide-react
npm install -D @types/three
```

- [ ] **Step 2: Replace `src/app/globals.css` with space theme**

```css
@import "tailwindcss";

@theme inline {
  --color-space-bg: #050510;
  --color-pulsar-blue: #00d4ff;
  --color-nebula-purple: #a855f7;
  --color-glass-bg: rgba(255, 255, 255, 0.05);
  --color-glass-border: rgba(255, 255, 255, 0.1);
  --color-text-primary: #f0f0f0;
  --color-text-secondary: #a0a0b0;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: auto;
}

body {
  background: var(--color-space-bg);
  color: var(--color-text-primary);
  overflow-x: hidden;
}

.glass {
  background: var(--color-glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-glass-border);
  border-radius: 16px;
}

.text-glow {
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paul Klein — Développeur Full-Stack",
  description:
    "Portfolio de Paul Klein, développeur full-stack. Voyage interstellaire à travers mes projets et compétences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on localhost:3000 with dark background, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/globals.css src/app/layout.tsx
git commit -m "feat: install dependencies and configure space theme base styles"
```

---

### Task 2: Constants & Scroll Hook

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/hooks/useScrollProgress.ts`

- [ ] **Step 1: Create `src/lib/constants.ts`**

```ts
export const SCROLL_HEIGHT = 700; // in vh units

export const CAMERA_POSITIONS = {
  heroStart: 0,
  heroEnd: 50,
  warpEnd: 200,
  project1: 280,
  project2: 350,
  project3: 420,
  nebulaStart: 500,
  nebulaEnd: 800,
  contactStart: 850,
  contactEnd: 900,
} as const;

// Scroll progress ranges (0-1) for each section
export const SECTIONS = {
  hero: { start: 0, end: 100 / SCROLL_HEIGHT },
  warp: { start: 100 / SCROLL_HEIGHT, end: 150 / SCROLL_HEIGHT },
  projects: { start: 150 / SCROLL_HEIGHT, end: 400 / SCROLL_HEIGHT },
  nebula: { start: 400 / SCROLL_HEIGHT, end: 600 / SCROLL_HEIGHT },
  contact: { start: 600 / SCROLL_HEIGHT, end: 700 / SCROLL_HEIGHT },
} as const;

export const PROJECTS = [
  {
    name: "My Watch List",
    description:
      "Gérez et partagez vos recommandations de films entre amis",
    stack: ["React", "Next.js", "Supabase"],
    github: "https://github.com/PaulKl10/mywatchlist",
    demo: "https://my-watch-list-silk.vercel.app",
    color: "#00d4ff",
    planetRadius: 8,
    orbitDistance: 60,
  },
  {
    name: "Fit For You",
    description:
      "Suivi de séances de gym, bibliothèque d'exercices et progression",
    stack: ["React", "Next.js", "Prisma"],
    github: "https://github.com/PaulKl10/FitForYou",
    demo: "https://fit-for-you-fitness.vercel.app",
    color: "#ff6b35",
    planetRadius: 10,
    orbitDistance: 100,
  },
  {
    name: "Sixtine Hanin",
    description: "Site vitrine pour une avocate au barreau de Lyon",
    stack: ["Next.js", "TypeScript"],
    github: "https://github.com/PaulKl10/Sixtine-Hanin",
    demo: "https://sixtinehaninavocat.com",
    color: "#ffd700",
    planetRadius: 7,
    orbitDistance: 140,
  },
] as const;

export const SKILLS = [
  { name: "React", color: "#61dafb" },
  { name: "Next.js", color: "#ffffff" },
  { name: "TypeScript", color: "#3178c6" },
  { name: "Figma", color: "#f24e1e" },
  { name: "C#", color: "#239120" },
  { name: ".NET", color: "#512bd4" },
  { name: "Supabase", color: "#3ecf8e" },
  { name: "Neon", color: "#00e599" },
  { name: "Prisma", color: "#2d3748" },
  { name: "MySQL", color: "#4479a1" },
] as const;

export const CONTACT = {
  email: "VOTRE_EMAIL@example.com", // À remplacer
  github: "https://github.com/PaulKl10",
  linkedin: "https://linkedin.com/in/VOTRE_PROFIL", // À remplacer
} as const;
```

- [ ] **Step 2: Create `src/hooks/useScrollProgress.ts`**

```ts
"use client";

import { useScroll, useTransform, MotionValue } from "framer-motion";

export function useScrollProgress(): {
  scrollYProgress: MotionValue<number>;
} {
  const { scrollYProgress } = useScroll();
  return { scrollYProgress };
}

/**
 * Returns a MotionValue mapped from global scroll progress to a local 0-1 range
 * within the given start/end scroll progress bounds.
 */
export function useSectionProgress(
  scrollYProgress: MotionValue<number>,
  start: number,
  end: number,
): MotionValue<number> {
  return useTransform(scrollYProgress, [start, end], [0, 1]);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts src/hooks/useScrollProgress.ts
git commit -m "feat: add project constants and scroll progress hooks"
```

---

### Task 3: CameraRig & SpaceScene Canvas Wrapper

**Files:**
- Create: `src/components/canvas/CameraRig.tsx`
- Create: `src/components/canvas/SpaceScene.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/canvas/CameraRig.tsx`**

This component reads scroll progress from a Framer Motion MotionValue passed via a React ref/store, and lerps the camera position on each frame.

```tsx
"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_POSITIONS } from "@/lib/constants";

interface CameraRigProps {
  scrollProgress: React.MutableRefObject<number>;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}

export function CameraRig({ scrollProgress, mousePosition }: CameraRigProps) {
  const { camera } = useThree();
  const targetZ = useRef(0);
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);

  useFrame(() => {
    const progress = scrollProgress.current;

    // Map scroll progress (0-1) to camera Z position
    const { heroStart, heroEnd, warpEnd, nebulaEnd, contactEnd } =
      CAMERA_POSITIONS;
    const z = THREE.MathUtils.lerp(heroStart, contactEnd, progress);
    targetZ.current = z;

    // Mouse parallax (only in hero section, progress < 0.14)
    if (progress < 0.14) {
      targetRotX.current = mousePosition.current.y * 0.02;
      targetRotY.current = mousePosition.current.x * 0.02;
    } else {
      targetRotX.current = 0;
      targetRotY.current = 0;
    }

    // Lerp camera position and rotation
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      targetZ.current,
      0.05,
    );
    camera.rotation.x = THREE.MathUtils.lerp(
      camera.rotation.x,
      targetRotX.current,
      0.05,
    );
    camera.rotation.y = THREE.MathUtils.lerp(
      camera.rotation.y,
      targetRotY.current,
      0.05,
    );
  });

  return null;
}
```

- [ ] **Step 2: Create `src/components/canvas/SpaceScene.tsx`**

This is the main canvas wrapper. It must be loaded with `ssr: false` from the page.

```tsx
"use client";

import { useRef, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { CameraRig } from "./CameraRig";

interface SpaceSceneProps {
  scrollYProgress: MotionValue<number>;
}

export default function SpaceScene({ scrollYProgress }: SpaceSceneProps) {
  const scrollProgress = useRef(0);
  const mousePosition = useRef({ x: 0, y: 0 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgress.current = v;
  });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      mousePosition.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    },
    [],
  );

  return (
    <div
      className="fixed inset-0 z-0"
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 2000 }}
        gl={{ antialias: false, alpha: false }}
      >
        <color attach="background" args={["#050510"]} />
        <CameraRig
          scrollProgress={scrollProgress}
          mousePosition={mousePosition}
        />
        {/* 3D scene components will be added in subsequent tasks */}
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/app/page.tsx` with canvas + scroll spacer**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { SCROLL_HEIGHT } from "@/lib/constants";

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
        {/* Overlay sections will be added in subsequent tasks */}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verify canvas renders**

```bash
npm run dev
```

Expected: Black screen fills the viewport, scrolling 700vh of empty space, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/CameraRig.tsx src/components/canvas/SpaceScene.tsx src/app/page.tsx
git commit -m "feat: add R3F canvas with camera rig and scroll-driven movement"
```

---

### Task 4: Starfield with Twinkle Shader

**Files:**
- Create: `src/components/canvas/Starfield.tsx`
- Modify: `src/components/canvas/SpaceScene.tsx`

- [ ] **Step 1: Create `src/components/canvas/Starfield.tsx`**

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 2000;
const SPHERE_RADIUS = 500;

const vertexShader = `
  attribute float aSize;
  attribute float aOffset;
  uniform float uTime;
  varying float vOpacity;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = sin(uTime * 2.0 + aOffset * 6.2831) * 0.3 + 0.7;
    vOpacity = twinkle;
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
    gl_FragColor = vec4(vec3(0.95, 0.95, 1.0), alpha);
  }
`;

interface StarfieldProps {
  scrollProgress: React.MutableRefObject<number>;
}

export function Starfield({ scrollProgress }: StarfieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, offsets } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    const off = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Distribute stars along a long tube (Z: -200 to 1200) for the full journey
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * SPHERE_RADIUS;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = Math.random() * 1400 - 200; // spread along Z

      sz[i] = Math.random() * 1.5 + 0.5;
      off[i] = Math.random();
    }
    return { positions: pos, sizes: sz, offsets: off };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute
          attach="attributes-aOffset"
          args={[offsets, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

- [ ] **Step 2: Add Starfield to SpaceScene**

In `src/components/canvas/SpaceScene.tsx`, add the import and render `<Starfield>` inside the Canvas, after CameraRig:

```tsx
// Add import at top:
import { Starfield } from "./Starfield";

// Inside <Canvas>, after <CameraRig>:
<Starfield scrollProgress={scrollProgress} />
```

Remove the comment `{/* 3D scene components will be added in subsequent tasks */}`.

- [ ] **Step 3: Verify starfield renders**

```bash
npm run dev
```

Expected: Thousands of twinkling white stars visible on dark background. Scrolling moves camera through the starfield.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/Starfield.tsx src/components/canvas/SpaceScene.tsx
git commit -m "feat: add starfield with twinkle shader and additive blending"
```

---

### Task 5: Warp Speed Effect

**Files:**
- Create: `src/components/canvas/WarpEffect.tsx`
- Modify: `src/components/canvas/SpaceScene.tsx`

- [ ] **Step 1: Create `src/components/canvas/WarpEffect.tsx`**

This renders stretched star-lines during the warp transition (scroll progress 0.14–0.21) and a white flash at the end.

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS } from "@/lib/constants";

const WARP_STAR_COUNT = 300;

const vertexShader = `
  attribute float aOffset;
  uniform float uStretch;
  uniform float uCameraZ;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Stretch stars along Z based on warp intensity
    pos.z += aOffset * uStretch * 20.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vAlpha = smoothstep(0.0, 0.3, uStretch);
    gl_PointSize = mix(1.0, 3.0, uStretch) * (150.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    // Elongated shape for streak effect
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(0.8, 0.9, 1.0, alpha);
  }
`;

interface WarpEffectProps {
  scrollProgress: React.MutableRefObject<number>;
}

export function WarpEffect({ scrollProgress }: WarpEffectProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const flashRef = useRef<THREE.Mesh>(null);

  const { positions, offsets } = useMemo(() => {
    const pos = new Float32Array(WARP_STAR_COUNT * 3);
    const off = new Float32Array(WARP_STAR_COUNT);
    for (let i = 0; i < WARP_STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 2] = 50 + Math.random() * 150; // in warp zone
      off[i] = Math.random();
    }
    return { positions: pos, offsets: off };
  }, []);

  useFrame(({ camera }) => {
    const progress = scrollProgress.current;
    const warpStart = SECTIONS.warp.start;
    const warpEnd = SECTIONS.warp.end;

    // Warp intensity: 0 outside warp zone, 0-1 during warp
    let stretch = 0;
    if (progress >= warpStart && progress <= warpEnd) {
      stretch = (progress - warpStart) / (warpEnd - warpStart);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uStretch.value = stretch;
      materialRef.current.uniforms.uCameraZ.value = camera.position.z;
    }

    // White flash at end of warp
    if (flashRef.current) {
      const flashProgress = Math.max(0, (stretch - 0.7) / 0.3); // last 30%
      const flashOpacity =
        flashProgress > 0 ? Math.sin(flashProgress * Math.PI) * 0.3 : 0;
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity =
        flashOpacity;
      flashRef.current.position.z = camera.position.z + 5;
    }
  });

  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aOffset"
            args={[offsets, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            uStretch: { value: 0 },
            uCameraZ: { value: 0 },
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* White flash plane */}
      <mesh ref={flashRef}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
```

- [ ] **Step 2: Add WarpEffect to SpaceScene**

In `src/components/canvas/SpaceScene.tsx`:

```tsx
// Add import:
import { WarpEffect } from "./WarpEffect";

// Inside <Canvas>, after <Starfield>:
<WarpEffect scrollProgress={scrollProgress} />
```

- [ ] **Step 3: Verify warp effect**

```bash
npm run dev
```

Expected: Scrolling past 100vh shows stars stretching into streaks with increasing intensity. White flash at ~150vh.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/WarpEffect.tsx src/components/canvas/SpaceScene.tsx
git commit -m "feat: add warp speed effect with star streaks and white flash"
```

---

### Task 6: Hero Overlay

**Files:**
- Create: `src/components/sections/HeroOverlay.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/sections/HeroOverlay.tsx`**

```tsx
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
```

- [ ] **Step 2: Add HeroOverlay to page.tsx**

In `src/app/page.tsx`, import and place inside the overlay div:

```tsx
// Add import:
import { HeroOverlay } from "@/components/sections/HeroOverlay";

// Inside the overlay div (replace the comment):
<HeroOverlay />
```

- [ ] **Step 3: Verify hero renders**

```bash
npm run dev
```

Expected: "Paul Klein" appears letter by letter with glow, subtitle fades in, chevron bounces at bottom.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/HeroOverlay.tsx src/app/page.tsx
git commit -m "feat: add hero overlay with staggered letter animation and scroll indicator"
```

---

### Task 7: Planetary System (3D)

**Files:**
- Create: `src/components/canvas/PlanetarySystem.tsx`
- Modify: `src/components/canvas/SpaceScene.tsx`

- [ ] **Step 1: Create `src/components/canvas/PlanetarySystem.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PROJECTS, CAMERA_POSITIONS } from "@/lib/constants";

const SYSTEM_CENTER_Z = (CAMERA_POSITIONS.warpEnd + CAMERA_POSITIONS.project3) / 2;

function Planet({
  color,
  radius,
  orbitDistance,
  orbitSpeed,
  index,
}: {
  color: string;
  radius: number;
  orbitDistance: number;
  orbitSpeed: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialAngle = (index * Math.PI * 2) / 3;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * orbitSpeed + initialAngle;
    meshRef.current.position.x = Math.cos(t) * orbitDistance;
    meshRef.current.position.y = Math.sin(t * 0.3) * (orbitDistance * 0.15);
    meshRef.current.position.z = SYSTEM_CENTER_Z + Math.sin(t) * orbitDistance;
    meshRef.current.rotation.y += 0.005;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.7}
        metalness={0.3}
      />
    </mesh>
  );
}

export function PlanetarySystem() {
  return (
    <group>
      {/* Central star */}
      <mesh position={[0, 0, SYSTEM_CENTER_Z]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color="#fff8e7" />
      </mesh>
      <pointLight
        position={[0, 0, SYSTEM_CENTER_Z]}
        intensity={200}
        distance={500}
        color="#fff8e7"
      />
      <ambientLight intensity={0.1} />

      {/* Orbiting planets */}
      {PROJECTS.map((project, i) => (
        <Planet
          key={project.name}
          color={project.color}
          radius={project.planetRadius}
          orbitDistance={project.orbitDistance}
          orbitSpeed={0.08 + i * 0.02}
          index={i}
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Add PlanetarySystem to SpaceScene**

In `src/components/canvas/SpaceScene.tsx`:

```tsx
// Add import:
import { PlanetarySystem } from "./PlanetarySystem";

// Inside <Canvas>, after <WarpEffect>:
<PlanetarySystem />
```

- [ ] **Step 3: Verify planets render**

```bash
npm run dev
```

Expected: After scrolling through warp, a glowing central star with 3 colored orbiting planets appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/PlanetarySystem.tsx src/components/canvas/SpaceScene.tsx
git commit -m "feat: add planetary system with orbiting project planets and central star"
```

---

### Task 8: Projects Overlay

**Files:**
- Create: `src/components/sections/ProjectsOverlay.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/sections/ProjectsOverlay.tsx`**

```tsx
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

  // Each project card appears at a different scroll point within the projects section
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
```

- [ ] **Step 2: Add ProjectsOverlay to page.tsx**

In `src/app/page.tsx`:

```tsx
// Add import:
import { ProjectsOverlay } from "@/components/sections/ProjectsOverlay";

// Inside the overlay div, after <HeroOverlay />:
{/* Warp zone spacer */}
<div style={{ height: `${(SECTIONS.warp.end - SECTIONS.warp.start) * SCROLL_HEIGHT}vh` }} />
<ProjectsOverlay />
```

Also add the SECTIONS import:
```tsx
import { SCROLL_HEIGHT, SECTIONS } from "@/lib/constants";
```

- [ ] **Step 3: Verify project cards**

```bash
npm run dev
```

Expected: Scrolling into the projects zone shows glassmorphism cards appearing with colored glow borders, alternating left/right alignment.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/ProjectsOverlay.tsx src/app/page.tsx
git commit -m "feat: add project overlay cards with scroll-driven animations and glassmorphism"
```

---

### Task 9: Nebula (3D Particles)

**Files:**
- Create: `src/components/canvas/Nebula.tsx`
- Modify: `src/components/canvas/SpaceScene.tsx`

- [ ] **Step 1: Create `src/components/canvas/Nebula.tsx`**

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_POSITIONS, SKILLS } from "@/lib/constants";

const BG_PARTICLE_COUNT = 500;
const NEBULA_CENTER_Z =
  (CAMERA_POSITIONS.nebulaStart + CAMERA_POSITIONS.nebulaEnd) / 2;
const NEBULA_SPREAD = 150;

const bgVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Brownian-ish drift
    pos.x += sin(uTime * 0.3 + position.z * 0.1) * 2.0;
    pos.y += cos(uTime * 0.2 + position.x * 0.1) * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vColor = aColor;
    vAlpha = 0.15 + 0.1 * sin(uTime + position.x);
    gl_PointSize = aSize * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const bgFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function Nebula() {
  const bgMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const bgData = useMemo(() => {
    const positions = new Float32Array(BG_PARTICLE_COUNT * 3);
    const sizes = new Float32Array(BG_PARTICLE_COUNT);
    const colors = new Float32Array(BG_PARTICLE_COUNT * 3);

    const purple = new THREE.Color("#a855f7");
    const blue = new THREE.Color("#00d4ff");

    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * NEBULA_SPREAD * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * NEBULA_SPREAD * 2;
      positions[i * 3 + 2] =
        NEBULA_CENTER_Z + (Math.random() - 0.5) * NEBULA_SPREAD * 2;

      sizes[i] = Math.random() * 2.5 + 0.5;

      const mix = Math.random();
      const color = purple.clone().lerp(blue, mix);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, sizes, colors };
  }, []);

  // Skill particles — larger, brighter, spread organically
  const skillData = useMemo(() => {
    const positions = new Float32Array(SKILLS.length * 3);
    const colors = new Float32Array(SKILLS.length * 3);
    const sizes = new Float32Array(SKILLS.length);

    SKILLS.forEach((skill, i) => {
      const angle = (i / SKILLS.length) * Math.PI * 2;
      const radius = 30 + Math.random() * 50;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] =
        Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] =
        NEBULA_CENTER_Z + (Math.random() - 0.5) * 60;

      const c = new THREE.Color(skill.color);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 6 + Math.random() * 2;
    });

    return { positions, colors, sizes };
  }, []);

  useFrame(({ clock }) => {
    if (bgMaterialRef.current) {
      bgMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group>
      {/* Background nebula particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[bgData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[bgData.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[bgData.colors, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={bgMaterialRef}
          vertexShader={bgVertexShader}
          fragmentShader={bgFragmentShader}
          uniforms={{ uTime: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Skill particles — brighter, larger */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[skillData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[skillData.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[skillData.colors, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={bgVertexShader}
          fragmentShader={bgFragmentShader.replace(
            "vAlpha;",
            "vAlpha; vAlpha = vAlpha * 3.0;",
          )}
          uniforms={{ uTime: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
```

- [ ] **Step 2: Add Nebula to SpaceScene**

In `src/components/canvas/SpaceScene.tsx`:

```tsx
// Add import:
import { Nebula } from "./Nebula";

// Inside <Canvas>, after <PlanetarySystem>:
<Nebula />
```

- [ ] **Step 3: Verify nebula renders**

```bash
npm run dev
```

Expected: Scrolling past the projects zone reveals a cloud of purple/blue particles with brighter colored skill particles.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/Nebula.tsx src/components/canvas/SpaceScene.tsx
git commit -m "feat: add nebula with background particles and colored skill orbs"
```

---

### Task 10: Skills Overlay

**Files:**
- Create: `src/components/sections/SkillsOverlay.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/sections/SkillsOverlay.tsx`**

```tsx
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
```

- [ ] **Step 2: Add SkillsOverlay to page.tsx**

In `src/app/page.tsx`:

```tsx
// Add import:
import { SkillsOverlay } from "@/components/sections/SkillsOverlay";

// After <ProjectsOverlay />, add a nebula-transition spacer then the skills:
{/* Nebula transition spacer */}
<div style={{ height: `${(SECTIONS.nebula.start - SECTIONS.projects.end) * SCROLL_HEIGHT}vh` }} />
<SkillsOverlay />
```

- [ ] **Step 3: Verify skill badges**

```bash
npm run dev
```

Expected: Floating glassmorphism badges appear staggered in the nebula zone, each with its brand color glow, gently bobbing up and down.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/SkillsOverlay.tsx src/app/page.tsx
git commit -m "feat: add skills overlay with floating glassmorphism badges and color glow"
```

---

### Task 11: Contact Overlay

**Files:**
- Create: `src/components/sections/ContactOverlay.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/sections/ContactOverlay.tsx`**

```tsx
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
```

- [ ] **Step 2: Add ContactOverlay to page.tsx**

In `src/app/page.tsx`:

```tsx
// Add import:
import { ContactOverlay } from "@/components/sections/ContactOverlay";

// After <SkillsOverlay />:
<ContactOverlay />
```

- [ ] **Step 3: Verify contact section**

```bash
npm run dev
```

Expected: At the bottom of the scroll, "Restons en contact" with glow text and 3 icon links appear with staggered animation.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/ContactOverlay.tsx src/app/page.tsx
git commit -m "feat: add contact overlay with icon links and staggered animation"
```

---

### Task 12: Audio Toggle

**Files:**
- Create: `src/components/AudioToggle.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/AudioToggle.tsx`**

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AudioToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      // Lazy-init the audio on first user interaction
      const audio = new Audio("/ambient.mp3");
      audio.loop = true;
      audio.volume = 0.2;
      audioRef.current = audio;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 glass p-3 hover:bg-white/10 transition-colors cursor-pointer"
      aria-label={isPlaying ? "Couper le son" : "Activer le son"}
    >
      {isPlaying ? (
        <Volume2 className="w-5 h-5 text-pulsar-blue" />
      ) : (
        <VolumeX className="w-5 h-5 text-text-secondary" />
      )}
    </button>
  );
}
```

- [ ] **Step 2: Add AudioToggle to page.tsx**

In `src/app/page.tsx`:

```tsx
// Add import:
import { AudioToggle } from "@/components/AudioToggle";

// After <SpaceScene>, before the overlay div:
<AudioToggle />
```

Note: The user will need to place an `ambient.mp3` file in the `public/` directory. A placeholder comment should be added to `constants.ts` or the component.

- [ ] **Step 3: Verify audio button renders**

```bash
npm run dev
```

Expected: A small glassmorphism button in the bottom-right corner with a muted speaker icon. Clicking toggles play state (no audio file yet, but no crash).

- [ ] **Step 4: Commit**

```bash
git add src/components/AudioToggle.tsx src/app/page.tsx
git commit -m "feat: add ambient audio toggle button with lazy initialization"
```

---

### Task 13: Final Page Assembly & Responsive Polish

**Files:**
- Modify: `src/app/page.tsx` (final assembly)

- [ ] **Step 1: Write the final `src/app/page.tsx`**

This is the complete assembled page with all sections, proper spacing, and reduced-motion support:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { SCROLL_HEIGHT, SECTIONS } from "@/lib/constants";
import { HeroOverlay } from "@/components/sections/HeroOverlay";
import { ProjectsOverlay } from "@/components/sections/ProjectsOverlay";
import { SkillsOverlay } from "@/components/sections/SkillsOverlay";
import { ContactOverlay } from "@/components/sections/ContactOverlay";
import { AudioToggle } from "@/components/AudioToggle";

const SpaceScene = dynamic(() => import("@/components/canvas/SpaceScene"), {
  ssr: false,
});

// Spacer heights in vh
const warpHeight =
  (SECTIONS.warp.end - SECTIONS.warp.start) * SCROLL_HEIGHT;
const nebulaTransitionHeight =
  (SECTIONS.nebula.start - SECTIONS.projects.end) * SCROLL_HEIGHT;

export default function Home() {
  const { scrollYProgress } = useScrollProgress();

  return (
    <>
      <SpaceScene scrollYProgress={scrollYProgress} />
      <AudioToggle />

      <div
        className="relative z-10 pointer-events-none"
        style={{ height: `${SCROLL_HEIGHT}vh` }}
      >
        <HeroOverlay />
        <div style={{ height: `${warpHeight}vh` }} aria-hidden="true" />
        <ProjectsOverlay />
        <div
          style={{ height: `${nebulaTransitionHeight}vh` }}
          aria-hidden="true"
        />
        <SkillsOverlay />
        <ContactOverlay />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Run build to catch type errors**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble final page with all sections and proper scroll spacing"
```

---

### Task 14: Lint, Build Verification & Final Cleanup

**Files:**
- Possibly modify any files with lint issues

- [ ] **Step 1: Run linter**

```bash
npm run lint
```

Fix any errors that appear.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds, no type errors.

- [ ] **Step 3: Manual test checklist**

Run `npm run dev` and verify:
- [ ] Stars twinkle and parallax follows mouse in hero
- [ ] Warp effect activates on scroll with star streaks
- [ ] Planets orbit and project cards appear at correct scroll positions
- [ ] Nebula particles drift with brownian motion
- [ ] Skill badges float and glow with brand colors
- [ ] Contact section appears at end with working links
- [ ] Audio toggle renders and works (with an audio file)
- [ ] Camera lerps smoothly between positions
- [ ] No console errors

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: lint fixes and final polish"
```
