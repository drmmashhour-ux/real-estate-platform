import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import monorepoIsolation from "../../rules/eslint/monorepo-isolation-plugin.mjs";

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
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "modules/**/*.{ts,tsx}",
      "config/**/*.{ts,tsx}",
    ],
    plugins: {
      "monorepo-isolation": monorepoIsolation,
    },
    rules: {
      "monorepo-isolation/no-cross-app-imports": ["error", { mode: "web" }],
    },
  },
]);

export default eslintConfig;
