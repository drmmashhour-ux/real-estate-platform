import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import monorepoIsolation from "../../rules/eslint/monorepo-isolation-plugin.mjs";

export default defineConfig([
  globalIgnores(["node_modules/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["lib/**/*.{ts,tsx}", "config/**/*.{ts,tsx}", "src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    plugins: {
      "monorepo-isolation": monorepoIsolation,
    },
    rules: {
      "monorepo-isolation/no-cross-app-imports": ["error", { mode: "uae" }],
    },
  },
]);
