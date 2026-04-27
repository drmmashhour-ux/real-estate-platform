/**
 * Global production lock (SYBNB / accidental payment hardening).
 * Default ON — set SYBNB_PRODUCTION_LOCK_MODE=false to relax (e.g. staging only, never in production customer env).
 */
export const PRODUCTION_LOCK_MODE = process.env.SYBNB_PRODUCTION_LOCK_MODE !== "false";
