/**
 * @deprecated Prefer `validateProductionEnvAtStartup` from `@/lib/env/production` (instrumentation).
 * Explicit throw helper for scripts / cron entrypoints.
 */
export function assertRequiredEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const db = process.env.DATABASE_URL?.trim();
  if (!db) throw new Error("assertRequiredEnv: DATABASE_URL is required in production");
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!app) throw new Error("assertRequiredEnv: NEXT_PUBLIC_APP_URL is required in production");
}
