import { EXPECTED_APP_NAME } from "@/config/app-identity";
import { SYRIA_CLOUDINARY_LISTINGS_FOLDER_DEFAULT } from "@/lib/syria/cloudinary-server";

/** Legacy folder name — never use for Syria production (shared-namespace risk vs Canada assets). */
const LEGACY_CLOUDINARY_LISTINGS_FOLDER = "sybnb/listings";

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
 * ORDER SYBNB-103 — reject accidental Canada-era Cloudinary folder on Syria production deploys.
 */
export function assertSyriaCloudinaryFolderIsolation(): void {
  const folder = process.env.CLOUDINARY_LISTINGS_FOLDER?.trim();
  if (!folder) return;
  const prod =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (!prod) return;
  if (folder === LEGACY_CLOUDINARY_LISTINGS_FOLDER) {
    throw new Error(
      `❌ CLOUDINARY_LISTINGS_FOLDER must not be "${LEGACY_CLOUDINARY_LISTINGS_FOLDER}" on Syria — use "${SYRIA_CLOUDINARY_LISTINGS_FOLDER_DEFAULT}" or another Syria-only prefix (ORDER SYBNB-103).`,
    );
  }
}

/**
 * One-shot guard: DB + app name + storage namespace (after `assertDarlinkRuntimeEnv`).
 */
export function assertSyriaAppIsolation(): void {
  assertSyriaAppNameEnv();
  assertSyriaDatabaseUrlIsolation();
  assertSyriaCloudinaryFolderIsolation();
}
