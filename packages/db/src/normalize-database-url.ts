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
 * Optional Prisma/pg pool cap via `DATABASE_CONNECTION_LIMIT` (e.g. `5`).
 * Merged as `connection_limit` query param on the Postgres URL to reduce "too many clients" spikes.
 */
export function mergeDatabaseConnectionLimit(url: string | undefined): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  const limRaw = process.env.DATABASE_CONNECTION_LIMIT?.trim();
  if (!limRaw) return trimmed;
  const n = Number(limRaw);
  if (!Number.isFinite(n) || n < 1) return trimmed;
  try {
    const u = new URL(trimmed);
    u.searchParams.set("connection_limit", String(Math.min(256, Math.floor(n))));
    return u.toString();
  } catch {
    return trimmed;
  }
}
