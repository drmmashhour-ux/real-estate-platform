import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseUrlForPrisma } from "./normalize-database-url";

/**
 * Safety guard: the postinstall script uses a placeholder DATABASE_URL so
 * `prisma generate` succeeds during CI/Vercel install (code generation only,
 * no DB connection). At RUNTIME the placeholder must never reach PrismaClient.
 */
const rawUrl = process.env.DATABASE_URL ?? "";
if (rawUrl.includes("placeholder") && !process.env.CI && !process.env.VERCEL_ENV) {
  throw new Error(
    "[LECIPM] DATABASE_URL contains 'placeholder'. " +
    "Set a real DATABASE_URL for runtime. The placeholder is only for prisma generate during CI."
  );
}

/** Neon may append channel_binding=require; Prisma/pg often need it stripped. */
const resolved = normalizeDatabaseUrlForPrisma(process.env.DATABASE_URL);
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
