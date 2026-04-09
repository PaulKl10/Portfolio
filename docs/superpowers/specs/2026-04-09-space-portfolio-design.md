# Portfolio Spatial Immersif - Design Spec

## Vue d'ensemble

Portfolio single-page de Paul Klein (Développeur Full-Stack) sur le thème d'un voyage interstellaire. Le scroll fait avancer l'utilisateur à travers une scène 3D (champ d'étoiles → warp speed → système planétaire → nébuleuse → espace calme).

## Stack technique

- **Framework** : Next.js 16 (App Router) + TypeScript
- **3D** : Three.js + @react-three/fiber + @react-three/drei
- **Animations HTML** : Framer Motion (useScroll, useTransform, staggerChildren)
- **Styling** : Tailwind CSS v4
- **Icônes** : Lucide React
- **Déploiement** : Vercel

## Architecture

### Structure des couches

```
[Canvas R3F - plein écran, position fixed, z-index 0]   ← scène 3D
[Overlay HTML - position relative, scrollable, z-index 10] ← contenu
```

Le canvas Three.js reste fixe en arrière-plan. Le contenu HTML scroll par-dessus. Framer Motion `useScroll` synchronise la position de la caméra 3D avec la progression du scroll via un contexte React partagé.

### Structure des fichiers

```
src/
├── app/
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Page unique, assemble les sections
│   └── globals.css         # Tailwind + variables custom
├── components/
│   ├── canvas/
│   │   ├── SpaceScene.tsx      # Canvas R3F principal (wrapper)
│   │   ├── Starfield.tsx       # Champ d'étoiles (Points geometry)
│   │   ├── WarpEffect.tsx      # Effet warp speed (étirement étoiles)
│   │   ├── PlanetarySystem.tsx # Étoile centrale + 3 planètes
│   │   ├── Nebula.tsx          # Particules nébuleuse
│   │   └── CameraRig.tsx       # Contrôle caméra lié au scroll
│   └── sections/
│       ├── HeroOverlay.tsx     # Titre Paul Klein + tagline
│       ├── ProjectsOverlay.tsx # Cartes projet glassmorphism
│       ├── SkillsOverlay.tsx   # Badges skills
│       └── ContactOverlay.tsx  # Liens contact
├── hooks/
│   └── useScrollProgress.ts   # Hook custom scroll progress [0-1]
└── lib/
    └── constants.ts           # Données projets, skills, couleurs
```

### Scroll mapping

| Scroll range | Section | Caméra Z | Événement 3D |
|---|---|---|---|
| 0 - 100vh | Hero | 0 → 50 | Champ d'étoiles, parallaxe souris |
| 100 - 150vh | Warp | 50 → 200 | Étoiles s'étirent en traînées |
| 150 - 400vh | Projets | 200 → 500 | Système planétaire, 3 stops |
| 400 - 450vh | Transition | 500 → 600 | Entrée nébuleuse |
| 450 - 600vh | Skills | 600 → 800 | Particules nébuleuse + badges |
| 600 - 700vh | Contact | 800 → 900 | Espace calme, étoiles lointaines |

**Hauteur totale du document** : 700vh.

## Sections détaillées

### 1. Hero (Deep Space) — 0 à 100vh

**3D :**
- ~2000 étoiles via `THREE.Points` avec `BufferGeometry`, tailles aléatoires (0.5-2.0), réparties dans un volume sphérique (rayon ~500)
- Scintillement : variation d'opacité dans un vertex shader custom (sin(time + random_offset))
- Parallaxe souris : léger offset de la rotation de la scène via `onPointerMove` (±2 degrés max)

**HTML overlay :**
- "Paul Klein" : `text-6xl font-bold`, apparition lettre par lettre (Framer Motion `staggerChildren: 0.05`)
- "Développeur Full-Stack" : `text-xl`, fade-in + translateY avec délai 0.5s
- Glow text : `text-shadow: 0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.3)`
- Flèche scroll : icône Lucide `ChevronDown`, animation bounce infinie

### 2. Transition Warp — 100 à 150vh

**3D :**
- Les étoiles s'étirent progressivement sur l'axe Z (scale Z de 1 à 20 dans le shader, piloté par le scroll progress)
- Accélération de la vitesse de la caméra (mouvement non linéaire, easing exponentiel)
- Flash blanc subtil à la fin : plan blanc semi-transparent devant la caméra, opacité 0 → 0.3 → 0

**Pas de contenu HTML dans cette zone.**

### 3. Projets (Système Planétaire) — 150 à 400vh

**3D :**
- Étoile centrale : `SphereGeometry` avec shader émissif (MeshStandardMaterial, emissive blanc-jaune), lumière PointLight
- 3 planètes en orbite :
  - **My Watch List** : rayon 8, couleur `#00d4ff` (cyan), distance orbitale 60
  - **Fit For You** : rayon 10, couleur `#ff6b35` (orange), distance orbitale 100
  - **Sixtine Hanin** : rayon 7, couleur `#ffd700` (doré), distance orbitale 140
- Rotation orbitale continue (indépendante du scroll, ~0.1 rad/s)
- Au scroll, la caméra s'arrête à 3 positions (une par planète) sur des paliers de ~80vh

**HTML overlay :**
- Carte glassmorphism pour chaque projet, apparition quand le scroll atteint le palier correspondant :
  - Background : `rgba(255,255,255,0.05)`, `backdrop-blur-md`, border `rgba(255,255,255,0.1)`
  - Glow border : box-shadow coloré reprenant la teinte de la planète
  - Contenu : nom (h3 bold), description (1 ligne), stack (badges petits), 2 boutons icônes (`Github`, `ExternalLink`)
- Animation d'entrée : `scale 0.8→1, opacity 0→1`, durée 0.6s

**Données projets :**

| Projet | Description | Stack | GitHub | Demo |
|---|---|---|---|---|
| My Watch List | Gérez et partagez vos recommandations de films entre amis | React, Next.js, Supabase | github.com/PaulKl10/mywatchlist | my-watch-list-silk.vercel.app |
| Fit For You | Suivi de séances de gym, bibliothèque d'exercices et progression | React, Next.js, Prisma | github.com/PaulKl10/FitForYou | fit-for-you-fitness.vercel.app |
| Sixtine Hanin | Site vitrine pour une avocate au barreau de Lyon | Next.js, TypeScript | github.com/PaulKl10/Sixtine-Hanin | sixtinehaninavocat.com |

### 4. Transition Nébuleuse — 400 à 450vh

**3D :**
- Le système planétaire s'éloigne derrière la caméra
- Des particules colorées (violet/bleu) commencent à apparaître, densité croissante
- Effet de brouillard progressif (fog Three.js ou particules semi-transparentes)

### 5. Skills (Nébuleuse) — 450 à 600vh

**3D :**
- ~500 particules de fond : tailles 0.5-3.0, opacité 0.1-0.3, couleurs violet `#a855f7` / bleu `#00d4ff` mélangées, mouvement brownien (déplacement aléatoire léger continu)
- 10 particules "techno" : tailles 5-8, plus lumineuses, positionnées dans un arrangement organique (pas de grille)

**Skills et couleurs associées :**

| Skill | Couleur |
|---|---|
| React | `#61dafb` |
| Next.js | `#ffffff` |
| TypeScript | `#3178c6` |
| Figma | `#f24e1e` |
| C# | `#239120` |
| .NET | `#512bd4` |
| Supabase | `#3ecf8e` |
| Neon | `#00e599` |
| Prisma | `#2d3748` |
| MySQL | `#4479a1` |

**HTML overlay :**
- Badge par techno : fond glassmorphism pill, font mono, glow de la couleur associée
- Apparition staggered au scroll (Framer Motion)
- Animation flottaison continue : translateY ±5px, durée 3-4s, ease in-out
- Au hover : la particule 3D correspondante pulse (scale + intensité lumineuse)

### 6. Contact — 600 à 700vh

**3D :**
- Sortie de la nébuleuse, espace ouvert sombre avec quelques étoiles lointaines
- Ambiance calme et contemplative

**HTML overlay :**
- "Restons en contact" : même style glow que le Hero
- 3 liens glassmorphism avec icônes Lucide (`Mail`, `Github`, `Linkedin`), apparition staggered
  - Mail : à renseigner par l'utilisateur dans `constants.ts`
  - GitHub : github.com/PaulKl10
  - LinkedIn : à renseigner par l'utilisateur dans `constants.ts`
- "Conçu par Paul Klein — 2026" en petit, centré

## Design système

### Palette

| Token | Valeur | Usage |
|---|---|---|
| `--space-bg` | `#050510` | Fond principal |
| `--pulsar-blue` | `#00d4ff` | Accent primaire, glow hero |
| `--nebula-purple` | `#a855f7` | Accent secondaire, nébuleuse |
| `--glass-bg` | `rgba(255,255,255,0.05)` | Fond cartes |
| `--glass-border` | `rgba(255,255,255,0.1)` | Bordure cartes |
| `--text-primary` | `#f0f0f0` | Texte principal |
| `--text-secondary` | `#a0a0b0` | Texte secondaire |

### Glassmorphism

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}
```

### Typographie

- Titres : Geist Sans (déjà inclus via Next.js), bold
- Corps : Geist Sans, regular
- Code/badges skills : Geist Mono

## Performance

- Le canvas R3F utilise `frameloop="demand"` quand hors viewport (si pertinent)
- Les composants overlay sont lazy-loaded par section
- Les textures planètes sont procédurales (shaders) plutôt que des images à charger
- `THREE.Points` pour les étoiles (un seul draw call pour ~2000 points)
- Debounce du `onPointerMove` pour la parallaxe souris (16ms)

## Accessibilité

- Le contenu HTML overlay est accessible au clavier et aux lecteurs d'écran
- Les liens/boutons ont des `aria-label` descriptifs
- Le canvas 3D a `aria-hidden="true"` (purement décoratif)
- Les animations respectent `prefers-reduced-motion` : si activé, les animations Framer Motion sont désactivées et la caméra 3D snap entre les sections sans transition

## Responsive

- **Desktop (>1024px)** : expérience complète avec 3D et parallaxe souris
- **Tablet (768-1024px)** : 3D maintenue, parallaxe souris désactivée
- **Mobile (<768px)** : 3D simplifiée (moins de particules, pas de post-processing), cartes en plein largeur
