import { PrismaClient } from "@/generated/prisma";

const rawUrl = process.env.DATABASE_URL ?? "";
if (rawUrl.includes("placeholder") && !process.env.CI && !process.env.VERCEL_ENV) {
  throw new Error("[SYBNB] DATABASE_URL contains 'placeholder'. Set a real DATABASE_URL.");
}

const globalForPrisma = globalThis as unknown as { syriaPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.syriaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.syriaPrisma = prisma;
