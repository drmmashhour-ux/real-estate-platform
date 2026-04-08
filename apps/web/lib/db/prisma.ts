import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseUrlForPrisma } from "./normalize-database-url";

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
