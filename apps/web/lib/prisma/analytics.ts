import { PrismaClient } from "../../prisma/generated/analytics";

const g = globalThis as unknown as { __lecipmPrismaAnalytics?: PrismaClient };

/** Domain client: bookings, AI / intelligence models, analytics aggregates (see prisma/analytics/schema.prisma). */
export const analyticsDb = g.__lecipmPrismaAnalytics ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  g.__lecipmPrismaAnalytics = analyticsDb;
}
