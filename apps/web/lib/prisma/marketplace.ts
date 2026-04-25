import { PrismaClient } from "../../prisma/generated/marketplace";

const g = globalThis as unknown as { __lecipmPrismaMarketplace?: PrismaClient };

export const marketplaceDb = g.__lecipmPrismaMarketplace ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaMarketplace = marketplaceDb;
}
