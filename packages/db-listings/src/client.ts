import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaLog: Array<"query" | "warn" | "error"> =
  process.env.PRISMA_LOG_QUERIES === "1" || process.env.NODE_ENV === "development"
    ? ["query", "warn", "error"]
    : ["warn", "error"];

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: prismaLog });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
