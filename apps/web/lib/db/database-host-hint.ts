/**
 * Hostname from DATABASE_URL only (no credentials). For logs / readiness when comparing Vercel vs local.
 */
export function getDatabaseHostHint(): string | null {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return null;
  try {
    const normalized = raw.replace(/^postgresql(\+[a-z0-9]+)?:/i, "http:");
    const host = new URL(normalized).hostname;
    return host || null;
  } catch {
    return null;
  }
}
