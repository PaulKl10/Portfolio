import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Disable strict React purity rules for imperative R3F canvas components.
  // Three.js objects (e.g. camera.position) are mutated imperatively inside
  // useFrame, and Math.random() inside useMemo with [] deps is standard
  // practice for generating procedural 3D geometry once on mount.
  {
    files: ["src/components/canvas/**/*.tsx"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
