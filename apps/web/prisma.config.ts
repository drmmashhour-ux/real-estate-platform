import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI skips default .env loading when prisma.config.ts exists — load explicitly.
const root = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(root, ".env") });
loadDotenv({ path: path.join(root, ".env.local") });

/** Generate/validate only need a syntactically valid URL; runtime must set a real DATABASE_URL. */
const PRISMA_CLI_PLACEHOLDER =
  "postgresql://prisma:prisma@127.0.0.1:5432/prisma?sslmode=disable";

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = PRISMA_CLI_PLACEHOLDER;
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
});
