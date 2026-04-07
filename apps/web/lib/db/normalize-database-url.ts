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
