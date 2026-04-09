export const SCROLL_HEIGHT = 900; // in vh units

export const CAMERA_POSITIONS = {
  heroStart: 0,
  heroEnd: 50,
  warpEnd: 200,
  project1: 280,
  project2: 350,
  project3: 420,
  nebulaStart: 500,
  nebulaEnd: 800,
  parcoursStart: 850,
  parcoursEnd: 1050,
  contactStart: 1100,
  contactEnd: 1200,
} as const;

// Scroll progress ranges (0-1) for each section
export const SECTIONS = {
  hero: { start: 0, end: 100 / SCROLL_HEIGHT },
  warp: { start: 100 / SCROLL_HEIGHT, end: 150 / SCROLL_HEIGHT },
  projects: { start: 150 / SCROLL_HEIGHT, end: 400 / SCROLL_HEIGHT },
  nebula: { start: 400 / SCROLL_HEIGHT, end: 500 / SCROLL_HEIGHT },
  parcours: { start: 530 / SCROLL_HEIGHT, end: 720 / SCROLL_HEIGHT },
  contact: { start: 740 / SCROLL_HEIGHT, end: 900 / SCROLL_HEIGHT },
} as const;

export const EXPERIENCES = [
  {
    company: "Gamma-project",
    role: "Ingénieur développement",
    period: "Avril 2025 — Présent",
    location: "Lyon",
  },
  {
    company: "Gamma-project",
    role: "Développeur",
    period: "Octobre 2023 — Mars 2025",
    location: "Lyon",
  },
] as const;

export const FORMATIONS = [
  {
    school: "Simplon Auvergne-Rhône-Alpes",
    diploma: "Concepteur et développeur d'application",
    period: "Sept. 2023 — Mars 2025",
  },
  {
    school: "Human Booster",
    diploma: "Développeur Web et Web Mobile",
    period: "Sept. 2022 — Sept. 2023",
  },
  {
    school: "IFPA",
    diploma: "Découverte technique en informatique",
    period: "Fév. 2022 — Juin 2022",
  },
  {
    school: "IFC",
    diploma: "BTS Management des Unités Commerciales",
    period: "Oct. 2017 — Juin 2019",
  },
] as const;

export const PROJECTS = [
  {
    name: "My Watch List",
    description:
      "Gérez et partagez vos recommandations de films entre amis",
    stack: ["React", "Next.js", "Supabase"],
    github: "https://github.com/PaulKl10/mywatchlist",
    demo: "https://my-watch-list-silk.vercel.app",
    screenshot: "/mywatchlist.png",
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
    screenshot: "/fitforyou.png",
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
    screenshot: "/sixtinehanin.png",
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
  { name: "Prisma", color: "#00d4ff" },
  { name: "MySQL", color: "#4479a1" },
] as const;

export const CONTACT = {
  email: "paul.klein43@gmail.com",
  github: "https://github.com/PaulKl10",
  linkedin: "https://www.linkedin.com/in/paul-klein-dev/",
} as const;
