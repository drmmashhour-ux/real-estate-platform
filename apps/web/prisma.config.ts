import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { defineConfig, env } from "prisma/config";
import { resolveDatabaseUrlIntoEnv } from "./lib/db/resolve-database-url";

// Prisma CLI skips default .env loading when prisma.config.ts exists — load explicitly.
const root = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(root, ".env") });
loadDotenv({ path: path.join(root, ".env.local") });

resolveDatabaseUrlIntoEnv();

/** Generate/validate only need a syntactically valid URL; runtime must set a real DATABASE_URL. */
const PRISMA_CLI_PLACEHOLDER =
  "postgresql://prisma:prisma@127.0.0.1:5432/prisma?sslmode=disable";

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = PRISMA_CLI_PLACEHOLDER;
}

/** Multi-file schema: `prisma/schema.prisma` (generator + datasource) + `prisma/*.prisma` (models). */
export default defineConfig({
  schema: "./prisma",
  migrations: {
    path: "./prisma/migrations",
    seed: "npx tsx prisma/seed-runner.ts",
  },
  /** Prisma ORM 7+: connection URL lives in config, not in the schema file. */
  datasource: {
    url: env("DATABASE_URL"),
  },
});
