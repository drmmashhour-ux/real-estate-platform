/**
 * Shared DATABASE_URL resolution for safety scripts. Never logs the URL value.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadDatabaseUrlFromDotEnv(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  const text = readFileSync(filePath, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    let v = m[1].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v || undefined;
  }
  return undefined;
}

/** Resolve DATABASE_URL from env, then apps/web/.env relative to cwd. */
export function resolveDatabaseUrl(cwd: string = process.cwd()): string | undefined {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  const webEnv = resolve(cwd, "apps/web/.env");
  return loadDatabaseUrlFromDotEnv(webEnv);
}

/** True when host is clearly local (no connection string logging). */
export function isLocalDatabaseUrl(url: string): boolean {
  try {
    const u = new URL(url.replace(/^postgres(ql)?:\/\//i, "postgres://"));
    const host = (u.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  } catch {
    if (/^postgres(ql)?:\/\/\/[^/]/i.test(url)) return true;
    const lower = url.toLowerCase();
    if (lower.includes("@localhost/") || lower.includes("@localhost:")) return true;
    if (lower.includes("@127.0.0.1/") || lower.includes("@127.0.0.1:")) return true;
  }
  return false;
}

export function isRemoteDatabaseUrl(url: string | undefined): boolean {
  return Boolean(url && !isLocalDatabaseUrl(url));
}
