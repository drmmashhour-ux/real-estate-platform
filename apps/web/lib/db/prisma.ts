import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseUrlForPrisma, resolveDatabaseUrlFromEnv } from "./normalize-database-url";

/** Prefer DATABASE_URL; fall back to Vercel/common aliases, then normalize for Prisma. */
const rawFromEnv = resolveDatabaseUrlFromEnv();
const resolved = normalizeDatabaseUrlForPrisma(rawFromEnv);
if (resolved !== undefined) {
  process.env.DATABASE_URL = resolved;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
