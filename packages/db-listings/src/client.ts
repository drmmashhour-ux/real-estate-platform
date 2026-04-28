import { createNoopPrismaClient } from "@repo/prisma-disabled-stub";
import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaLog: Array<"query" | "warn" | "error"> =
  process.env.PRISMA_LOG_QUERIES === "1" || process.env.NODE_ENV === "development"
    ? ["query", "warn", "error"]
    : ["warn", "error"];

function createListingsClient(): PrismaClient {
  if (process.env.NEXT_PUBLIC_DISABLE_DB === "true") {
    return createNoopPrismaClient() as PrismaClient;
  }
  return new PrismaClient({ log: prismaLog });
}

export const prisma = globalForPrisma.prisma ?? createListingsClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
