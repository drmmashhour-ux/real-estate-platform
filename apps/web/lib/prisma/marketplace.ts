import { PrismaClient } from "../../prisma/generated/marketplace";
import { lecipmPrismaClientOptions } from "./prisma-client-options";

const g = globalThis as unknown as { __lecipmPrismaMarketplace?: PrismaClient };

export const marketplaceDb =
  g.__lecipmPrismaMarketplace ?? new PrismaClient(lecipmPrismaClientOptions());
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaMarketplace = marketplaceDb;
}
