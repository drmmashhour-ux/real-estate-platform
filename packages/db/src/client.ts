/**
 * Singleton Prisma client for scripts and workspace packages.
 * Uses the same generated client as @lecipm/web (apps/web/prisma/schema.prisma).
 *
 * Ensure `prisma generate` has been run (e.g. `pnpm --filter @lecipm/web exec prisma generate`).
 * Load DATABASE_URL from env before importing in CLI scripts.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
