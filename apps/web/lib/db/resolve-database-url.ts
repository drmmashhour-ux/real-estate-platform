import { databaseUrlHasLiteralHostPlaceholder } from "./database-host-hint";

/**
 * Prisma expects `DATABASE_URL`. Vercel Postgres (Storage → Create Database) injects
 * `POSTGRES_PRISMA_URL` (pooler, Prisma-friendly) and `POSTGRES_URL`.
 *
 * If `DATABASE_URL` is unset or still a template (`@HOST`), copy from those vars so
 * deploys work without manually duplicating the string as `DATABASE_URL`.
 */
export function resolveDatabaseUrlIntoEnv(): void {
  const current = process.env.DATABASE_URL?.trim();
  const broken = !current || databaseUrlHasLiteralHostPlaceholder(current);
  if (!broken) return;

  const vercelPg =
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim();

  if (vercelPg) {
    process.env.DATABASE_URL = vercelPg;
  }
}
