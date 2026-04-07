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

/** Classify host for /api/ready — never exposes credentials. */
export function getDbHostKind(host: string | null): "neon" | "supabase" | "other" | "unset" {
  if (!host) return "unset";
  if (host.includes("neon.tech")) return "neon";
  if (host.includes("supabase.co")) return "supabase";
  return "other";
}
