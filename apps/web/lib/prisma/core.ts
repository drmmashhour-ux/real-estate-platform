import { PrismaClient } from "../../prisma/generated/core";
import { lecipmPrismaClientOptions } from "./prisma-client-options";

const g = globalThis as unknown as { __lecipmPrismaCore?: PrismaClient };

export const coreDb =
  g.__lecipmPrismaCore ?? new PrismaClient(lecipmPrismaClientOptions());
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaCore = coreDb;
}
