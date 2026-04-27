import { databaseUrlHasLiteralHostPlaceholder } from "./database-host-hint";
import { ensureDatabaseUrlSslModeRequireForRemote } from "./database-url-ssl";

/**
 * Prisma expects `DATABASE_URL`. Resolution order when missing or template:
 * 1) `SUPABASE_POOLER_URL` / `SUPABASE_DATABASE_URL` — Supabase transaction pooler (port 6543) for serverless
 * 2) Vercel `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`
 *
 * After resolution, non-local URLs get `sslmode=require` if not already set (Supabase/RDS/managed Postgres).
 */
export function resolveDatabaseUrlIntoEnv(): void {
  const current = process.env.DATABASE_URL?.trim();
  const broken = !current || databaseUrlHasLiteralHostPlaceholder(current);

  if (broken) {
    const supabasePooled =
      process.env.SUPABASE_POOLER_URL?.trim() ||
      process.env.SUPABASE_DATABASE_URL?.trim() ||
      process.env.SUPABASE_DB_URL?.trim();
    if (supabasePooled) {
      process.env.DATABASE_URL = supabasePooled;
    } else {
      const vercelPg =
        process.env.POSTGRES_PRISMA_URL?.trim() ||
        process.env.POSTGRES_URL?.trim() ||
        process.env.POSTGRES_URL_NON_POOLING?.trim();
      if (vercelPg) {
        process.env.DATABASE_URL = vercelPg;
      }
    }
  }

  const d = process.env.DATABASE_URL?.trim();
  if (d) {
    process.env.DATABASE_URL = ensureDatabaseUrlSslModeRequireForRemote(d);
  }
}
