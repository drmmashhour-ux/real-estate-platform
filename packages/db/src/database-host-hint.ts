/** True when the URL still uses the template hostname `HOST` (e.g. copied from an example before substitution). */
export function databaseUrlHasLiteralHostPlaceholder(raw: string | undefined | null): boolean {
  const db = raw?.trim();
  if (!db) return false;
  return /@[Hh][Oo][Ss][Tt](?=[:/?#]|$)/.test(db);
}

/**
 * Hostname from DATABASE_URL only (no credentials). For logs / readiness when comparing Vercel vs local.
 */
export function getDatabaseHostHint(): string | null {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return null;
  try {
    const normalized = raw.replace(/^postgresql(\+[a-z0-9]+)?:/i, "http:");
    const host = new URL(normalized).hostname;
    if (host) return host;
  } catch {
    /* URL() fails on some connection strings (e.g. special chars in password) */
  }
  const segment = raw.split("@")[1]?.split("/")[0]?.trim();
  if (!segment) return null;
  const hostOnly = segment.split(":")[0]?.trim();
  return hostOnly || null;
}

export type DbHostKind = "supabase" | "placeholder" | "unknown" | "unset";

/** Classify host for /api/ready — hostname only; never exposes credentials. */
export function getDbHostKind(host: string | null): DbHostKind {
  if (!host) return "unset";
  if (host.toLowerCase() === "host") return "placeholder";
  if (host.includes("supabase.co") || host.includes("pooler.supabase.com")) return "supabase";
  return "unknown";
}
