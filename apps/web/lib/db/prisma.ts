import { PrismaClient } from "@prisma/client";
import { getDatabaseHostHint } from "./database-host-hint";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Temporary: set VERCEL_DEBUG=1 on Vercel to log parsed DB hostname (no credentials). */
if (process.env.VERCEL_DEBUG === "1") {
  console.log("DATABASE_URL host:", getDatabaseHostHint() ?? "(unset or unparsable)");
}

export default prisma;
