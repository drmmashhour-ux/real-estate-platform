import { PrismaClient } from "@prisma/client";
import {
  ensureSslModeRequireForSupabase,
  normalizeDatabaseUrlForPrisma,
  resolveDatabaseUrlFromEnv,
} from "./normalize-database-url";

/** Prefer DATABASE_URL; fall back to Vercel/common aliases, normalize, then enforce Supabase SSL. */
const rawFromEnv = resolveDatabaseUrlFromEnv();
const resolved = normalizeDatabaseUrlForPrisma(rawFromEnv);
const prismaDatasourceUrl = resolved ? ensureSslModeRequireForSupabase(resolved) : undefined;
if (prismaDatasourceUrl !== undefined) {
  process.env.DATABASE_URL = prismaDatasourceUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    ...(prismaDatasourceUrl
      ? { datasources: { db: { url: prismaDatasourceUrl } } }
      : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
