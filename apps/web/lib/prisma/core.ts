import { PrismaClient } from "../../prisma/generated/core";

const g = globalThis as unknown as { __lecipmPrismaCore?: PrismaClient };

export const coreDb = g.__lecipmPrismaCore ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaCore = coreDb;
}
