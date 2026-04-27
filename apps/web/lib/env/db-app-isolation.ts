import { APP_ID } from "@/lib/config/app-identity";

/**
 * Ensure apps/web does not point at a SYBNB/Darlink-reserved database name in `DATABASE_URL`.
 * In production this is always enforced. In development, set `APP_DB_ISOLATION_RELAXED=1` only for
 * local experiments — never in deployed environments.
 */
export function assertLecipmDatabaseUrlIsolation(): void {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return;

  const u = raw.toLowerCase();
  const prod =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const relaxed = !prod && process.env.APP_DB_ISOLATION_RELAXED === "1";

  if (relaxed) return;

  if (u.includes("sybnb") || u.includes("darlink_sy") || u.includes("syria_sybnb")) {
    throw new Error("❌ LECIPM app must not use the SYBNB (Syria app) database");
  }
}

function isVercelDeploy(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV?.trim());
}

/**
 * If `APP_NAME` is set, it must match `APP_ID` (catches wrong merged env).
 * On Vercel, `APP_NAME=lecipm` is required in production. Local/CI `next build` does not set `VERCEL`, so the guard is skipped when unset.
 */
export function assertLecipmAppNameEnv(): void {
  const raw = process.env.APP_NAME?.trim();
  if (!raw) {
    if (
      (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") &&
      isVercelDeploy()
    ) {
      throw new Error("❌ Wrong env loaded for LECIPM — set APP_NAME=lecipm in Vercel for this app");
    }
    return;
  }
  if (raw !== APP_ID) {
    throw new Error(`❌ Wrong env loaded for LECIPM (APP_NAME must be ${APP_ID}, not ${raw})`);
  }
}
