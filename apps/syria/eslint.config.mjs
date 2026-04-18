import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import monorepoIsolation from "../../rules/eslint/monorepo-isolation-plugin.mjs";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "node_modules/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "monorepo-isolation": monorepoIsolation,
    },
    rules: {
      "monorepo-isolation/no-cross-app-imports": ["error", { mode: "syria" }],
    },
  },
]);
