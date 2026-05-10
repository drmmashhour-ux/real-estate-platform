import { PrismaClient } from "@/generated/prisma";

/**
 * Runtime guard: the postinstall script uses a placeholder DATABASE_URL so
 * prisma generate succeeds during CI/Vercel install. At RUNTIME the
 * placeholder must never reach PrismaClient.
 */
const rawUrl = process.env.DATABASE_URL ?? "";
if (rawUrl.includes("placeholder") && !process.env.CI && !process.env.VERCEL_ENV) {
  throw new Error(
    "[SYBNB] DATABASE_URL contains 'placeholder'. Set a real DATABASE_URL for runtime."
  );
}

const globalForPrisma = globalThis as unknown as { syriaPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.syriaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.syriaPrisma = prisma;
