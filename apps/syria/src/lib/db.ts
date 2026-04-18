import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { syriaPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.syriaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.syriaPrisma = prisma;
