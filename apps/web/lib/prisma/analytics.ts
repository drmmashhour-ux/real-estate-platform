import { PrismaClient } from "../../prisma/generated/analytics";
import { lecipmPrismaClientOptions } from "./prisma-client-options";

const g = globalThis as unknown as { __lecipmPrismaAnalytics?: PrismaClient };

/** Domain client: bookings, AI / intelligence models, analytics aggregates (see prisma/analytics/schema.prisma). */
export const analyticsDb =
  g.__lecipmPrismaAnalytics ?? new PrismaClient(lecipmPrismaClientOptions());
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaAnalytics = analyticsDb;
}
