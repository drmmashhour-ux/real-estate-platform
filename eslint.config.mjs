import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** Shared ESLint config for LECIPM monorepo. Apps (e.g. Next) use their own config. */
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
