import js from "@eslint/js";
import tseslint from "typescript-eslint";
import monorepoIsolation from "./rules/eslint/monorepo-isolation-plugin.mjs";

/**
 * Shared ESLint config for LECIPM monorepo. Product apps use their own eslint.config.mjs:
 * apps/web, apps/syria, apps/hadialink — each enforces `monorepo-isolation/no-cross-app-imports`.
 * Static scan: `pnpm run check:isolation` (scripts/check-isolation.ts).
 * Legacy `.eslintrc.cjs` documents the same; ESLint 9 reads this flat config only.
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/coverage/**",
      "apps/web/**",
      "apps/mobile/**",
      "apps/admin-dashboard/**",
      "apps/broker-dashboard/**",
      "apps/owner-dashboard/**",
      "apps/mobile-app/**",
      "apps/carrefour-prestige/**",
      "apps/web-next14-starter/**",
      "apps/uae/**",
      "apps/hadialink/**",
      "carrefour-immobilier/**",
      "immobilier-prestige/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "writable",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["packages/**/*.{ts,tsx,mjs}"],
    ignores: ["**/node_modules/**", "**/dist/**"],
    plugins: {
      "monorepo-isolation": monorepoIsolation,
    },
    rules: {
      "monorepo-isolation/no-cross-app-imports": ["error", { mode: "package" }],
    },
  },
  // Express `declare global { namespace Express { ... } }` pattern
  {
    files: [
      "services/listing-service/src/authMiddleware.ts",
      "services/messaging-service/src/authContext.ts",
      "services/user-service/src/authMiddleware.ts",
    ],
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  }
);
