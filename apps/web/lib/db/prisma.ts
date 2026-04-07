import { PrismaClient } from "@prisma/client";

function getDbHost(url?: string) {
  try {
    if (!url) return "missing";
    return new URL(url).host;
  } catch {
    return "invalid";
  }
}

if (process.env.NODE_ENV !== "production") {
  console.log("DB HOST:", getDbHost(process.env.DATABASE_URL));
}

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

export default prisma;
