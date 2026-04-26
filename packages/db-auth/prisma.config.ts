import { defineConfig, env } from "prisma/config";

const PRISMA_CLI_PLACEHOLDER =
  "postgresql://prisma:prisma@127.0.0.1:5432/prisma?sslmode=disable";

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = PRISMA_CLI_PLACEHOLDER;
}

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});
