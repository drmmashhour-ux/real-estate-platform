import { EXPECTED_APP_NAME } from "@/config/app-identity";

function isVercelDeploy(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV?.trim());
}

/**
 * `DATABASE_URL` for Syria must not use the LECIPM app database name token (e.g. `/lecipm` in path).
 * Production: always enforced. Dev: set `APP_DB_ISOLATION_RELAXED=1` only for legacy local DB names.
 */
export function assertSyriaDatabaseUrlIsolation(): void {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return;

  const u = raw.toLowerCase();
  if (!u.includes("lecipm")) return;

  const prod =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const relaxed = !prod && process.env.APP_DB_ISOLATION_RELAXED === "1";

  if (relaxed) return;

  throw new Error(
    "❌ Syria app using LECIPM database (use a dedicated database name; in local dev only, set APP_DB_ISOLATION_RELAXED=1 if you must use a shared Postgres with a lecipm DB name).",
  );
}

/**
 * Catches wrong merged `.env` if `APP_NAME` is set. Production requires `APP_NAME=syria`.
 */
export function assertSyriaAppNameEnv(): void {
  const raw = process.env.APP_NAME?.trim();
  if (!raw) {
    if (
      (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") &&
      isVercelDeploy()
    ) {
      throw new Error("❌ Wrong env loaded for Syria — set APP_NAME=syria in Vercel for this app");
    }
    return;
  }
  if (raw !== EXPECTED_APP_NAME) {
    throw new Error(
      `❌ Wrong env loaded for Syria (APP_NAME must be ${EXPECTED_APP_NAME}, not ${raw})`,
    );
  }
}

/**
 * One-shot guard: DB + app name (after `assertDarlinkRuntimeEnv`).
 */
export function assertSyriaAppIsolation(): void {
  assertSyriaAppNameEnv();
  assertSyriaDatabaseUrlIsolation();
}
