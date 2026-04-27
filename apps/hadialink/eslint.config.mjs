import { defineConfig, globalIgnores } from "eslint/config";
import monorepoIsolation from "../../rules/eslint/monorepo-isolation-plugin.mjs";

export default defineConfig([
  globalIgnores(["node_modules/**", "dist/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: {
      "monorepo-isolation": monorepoIsolation,
    },
    rules: {
      "monorepo-isolation/no-cross-app-imports": ["error", { mode: "hadialink" }],
    },
  },
]);
