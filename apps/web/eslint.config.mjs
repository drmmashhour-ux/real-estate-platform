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
  // Order 89 — monolith: prefer `@/lib/db` in app code. Barrel files must import `@repo/db` to re-export.
  // Order 81.1 — `db-safe` / `db-direct` are internal; all usage goes through `lib/db/index` / `@/lib/db`.
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "modules/**/*.{ts,tsx}",
      "config/**/*.{ts,tsx}",
    ],
    ignores: [
      "lib/db.ts",
      "lib/db/index.ts",
      "lib/db/sql-query.ts",
      "lib/db-safe.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@repo/db",
              message:
                "Use @/lib/db instead (e.g. monolithPrisma, marketplacePrisma, pool). Do not import the monolith client package directly in app code.",
            },
            {
              name: "@/lib/db-safe",
              message:
                "Order 81.1: use @/lib/db (query, safeQuery, getDbResilienceState, isDbCircuitOpen, setPoolProbeResult, …).",
            },
            {
              name: "@/lib/db-direct",
              message: "Order 81.1: use @/lib/db for pool, getPoolStats, and query().",
            },
          ],
        },
      ],
    },
  },
  {
    // Stricter surface for the service / marketplace facades (no @repo/db here).
    files: [
      "lib/services/**/*.ts",
      "lib/marketplace/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@repo/db",
              message:
                "Use @/lib/db (monolithPrisma or marketplacePrisma) instead of importing @repo/db directly.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
