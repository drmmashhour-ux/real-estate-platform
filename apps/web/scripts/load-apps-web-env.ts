/**
 * Load `.env` + `.env.local` (local overrides) before any module that reads `process.env.DATABASE_URL`.
 * Mirrors `prisma.config.ts` + `resolveDatabaseUrlIntoEnv` for CLI scripts.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { resolveDatabaseUrlIntoEnv } from "../lib/db/resolve-database-url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local"), override: true });
resolveDatabaseUrlIntoEnv();
