import { PrismaClient } from "@prisma/client";
import { databaseUrlHasLiteralHostPlaceholder } from "./database-host-hint";
import { normalizeDatabaseUrlForPrisma } from "./normalize-database-url";
import { resolveDatabaseUrlIntoEnv } from "./resolve-database-url";

resolveDatabaseUrlIntoEnv();

const rawDatabaseUrl = process.env.DATABASE_URL;
if (
  databaseUrlHasLiteralHostPlaceholder(rawDatabaseUrl) &&
  process.env.NODE_ENV !== "test"
) {
  throw new Error(
    "[lecipm] DATABASE_URL is missing, uses placeholder hostname HOST, or is invalid. Fix: set DATABASE_URL in Vercel, or add Vercel Postgres so POSTGRES_PRISMA_URL / POSTGRES_URL is present (see docs/deployment/DATABASE_URL_VERCEL_NEON.md)."
  );
}

/** Neon may append channel_binding=require; Prisma/pg often need it stripped. */
const resolved = normalizeDatabaseUrlForPrisma(rawDatabaseUrl);
if (resolved !== undefined) {
  process.env.DATABASE_URL = resolved;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
