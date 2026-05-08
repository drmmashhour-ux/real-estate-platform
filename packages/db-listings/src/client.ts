import { createNoopPrismaClient } from "@repo/prisma-disabled-stub";
import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createListingsClient(): PrismaClient {
  if (process.env.NEXT_PUBLIC_DISABLE_DB === "true") {
    return createNoopPrismaClient() as PrismaClient;
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set — required for db-listings.");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createListingsClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
