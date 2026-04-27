/**
 * PostgreSQL URL SSL expectations for production.
 * Neon / managed Postgres should use TLS; libpq accepts sslmode=require (or verify-full) in the query string.
 */

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
]);

function parsePostgresUrl(raw: string): URL | null {
  const t = raw.trim();
  if (!t.startsWith("postgresql://") && !t.startsWith("postgres://")) {
    return null;
  }
  try {
    return new URL(t);
  } catch {
    return null;
  }
}

export function isLocalDatabaseHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (LOCAL_HOSTS.has(h)) return true;
  if (h.endsWith(".localhost")) return true;
  return false;
}

const STRICT_SSL_MODES = new Set(["require", "verify-ca", "verify-full"]);

/**
 * True if the URL explicitly requests TLS for non-local Postgres (libpq-compatible).
 * `sslmode=prefer` / unset are treated as not guaranteed — production should use require or verify-*.
 */
export function databaseUrlDeclaresSsl(url: URL): boolean {
  const mode = (url.searchParams.get("sslmode") ?? "").toLowerCase();
  if (mode === "disable" || mode === "allow") return false;
  if (mode && STRICT_SSL_MODES.has(mode)) return true;
  const ssl = (url.searchParams.get("ssl") ?? "").toLowerCase();
  if (ssl === "true" || ssl === "1") return true;
  return false;
}

/**
 * Production warning text if a non-local DATABASE_URL should declare SSL.
 * Returns null if OK or not applicable.
 */
export function getDatabaseSslWarningForProduction(databaseUrl: string | undefined): string | null {
  const raw = databaseUrl?.trim();
  if (!raw) return null;
  const u = parsePostgresUrl(raw);
  if (!u) return null;
  if (isLocalDatabaseHost(u.hostname)) return null;
  if (databaseUrlDeclaresSsl(u)) return null;
  return (
    "DATABASE_URL must use encrypted connections for non-local hosts — add ?sslmode=require " +
    "(or verify-full) to the connection string. See docs/security/PROD-SECURITY-CHECKLIST.md."
  );
}

export function productionRequiresDatabaseSslStrict(): boolean {
  return (
    (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") &&
    process.env.REQUIRE_DATABASE_SSL_IN_URL === "1"
  );
}

/**
 * For non-local PostgreSQL URLs, appends `sslmode=require` when no explicit strict TLS mode is set.
 * Respects `sslmode=disable` / `allow` (returns unchanged). Supabase pooler + Prisma expect TLS.
 */
export function ensureDatabaseUrlSslModeRequireForRemote(urlStr: string): string {
  const raw = urlStr.trim();
  const u = parsePostgresUrl(raw);
  if (!u) return urlStr;
  if (isLocalDatabaseHost(u.hostname)) return urlStr;
  const mode = (u.searchParams.get("sslmode") ?? "").toLowerCase();
  if (mode === "disable" || mode === "allow") return urlStr;
  if (databaseUrlDeclaresSsl(u)) return urlStr;
  u.searchParams.set("sslmode", "require");
  return u.toString();
}
