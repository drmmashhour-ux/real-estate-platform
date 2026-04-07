import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseUrlForPrisma } from "./normalize-database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: normalizeDatabaseUrlForPrisma(process.env.DATABASE_URL),
      },
    },
  });

globalForPrisma.prisma = prisma;
