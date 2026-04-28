import { PrismaClient } from "../../prisma/generated/compliance";
import { lecipmPrismaClientOptions } from "./prisma-client-options";

const g = globalThis as unknown as { __lecipmPrismaCompliance?: PrismaClient };

export const complianceDb =
  g.__lecipmPrismaCompliance ?? new PrismaClient(lecipmPrismaClientOptions());
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaCompliance = complianceDb;
}
