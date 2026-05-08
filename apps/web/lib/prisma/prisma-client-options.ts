import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7: requires driver adapter. datasourceUrl / datasources removed.
 * Returns PrismaClient constructor options with @prisma/adapter-pg.
 */
export function lecipmPrismaClientOptions(): { adapter: PrismaPg } {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set — required for PrismaClient (LECIPM).");
  }
  return { adapter: new PrismaPg({ connectionString: url }) };
}
