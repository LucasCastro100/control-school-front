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
  // Components gerados por https://reactbits.dev — código de terceiros, fora do escopo do lint do app.
  {
    ignores: ["src/components/{Beams,CountUp,FloatingLines,GhostFibers,GradientText,Magnet,Particles,ShinyText,SplitText,SpotlightCard,StarBorder}.tsx"],
  },
]);

export default eslintConfig;
