import { logFallback as recordFallback } from "../db-fallback-log";

/**
 * Used by `lib/db/db-safe.ts` (relative `./db-fallback-log`).
 * Dev-only console + in-memory ring buffer for `/api/dev/db-fallbacks`.
 */
export function logFallback(message: string, meta?: unknown): void {
  const detail =
    typeof meta === "string"
      ? meta
      : meta !== undefined && meta !== null
        ? String(meta)
        : undefined;
  recordFallback(message, detail);
  if (process.env.NODE_ENV !== "production") {
    console.warn("[DB FALLBACK]", message, detail ?? "");
  }
}
