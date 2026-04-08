/**
 * Vercel Postgres / some templates expose `POSTGRES_URL` or `PRISMA_DATABASE_URL`
 * instead of `DATABASE_URL`. Normalize to one value for Prisma.
 */
export function resolveDatabaseUrlFromEnv(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.PRISMA_DATABASE_URL,
  ];
  for (const c of candidates) {
    const t = c?.trim();
    if (t) return t;
  }
  return undefined;
}

/**
 * Neon connection strings sometimes include `channel_binding=require`.
 * That parameter breaks many Prisma + node-postgres stacks on Vercel/serverless.
 * Strip it while preserving other query params (e.g. sslmode=require).
 */
export function normalizeDatabaseUrlForPrisma(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const q = trimmed.indexOf("?");
  if (q === -1) return trimmed;
  const base = trimmed.slice(0, q);
  const query = trimmed.slice(q + 1);
  const params = new URLSearchParams(query);
  if (!params.has("channel_binding")) return trimmed;
  params.delete("channel_binding");
  const next = params.toString();
  return next ? `${base}?${next}` : base;
}

/**
 * Supabase direct DB host requires TLS; ensure sslmode=require if the URL omits it.
 */
export function ensureSslModeRequireForSupabase(url: string): string {
  const t = url.trim();
  if (!t || !/supabase\.co/i.test(t)) return t;
  if (/[?&]sslmode=/i.test(t)) return t;
  return t.includes("?") ? `${t}&sslmode=require` : `${t}?sslmode=require`;
}
