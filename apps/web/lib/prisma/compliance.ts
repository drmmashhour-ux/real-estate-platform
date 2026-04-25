import { PrismaClient } from "../../prisma/generated/compliance";

const g = globalThis as unknown as { __lecipmPrismaCompliance?: PrismaClient };

export const complianceDb = g.__lecipmPrismaCompliance ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaCompliance = complianceDb;
}
