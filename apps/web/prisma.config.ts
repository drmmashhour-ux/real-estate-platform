import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { defineConfig, env } from "prisma/config";

/** Prisma CLI does not load `.env.local` by default; mirror scripts/load-apps-web-env order. */
const root = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(root, ".env") });
loadDotenv({ path: path.join(root, ".env.local"), override: true });

/** Prisma 7+: Migrate reads `DATABASE_URL` from prisma.config datasource (schema may not declare `url`). */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
