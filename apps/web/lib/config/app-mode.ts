/**
 * Controlled E2E / QA mode — banners, stricter Stripe checks, extra logging.
 * Set `NEXT_PUBLIC_APP_MODE=test` (client + server readable in Next.js).
 */

function truthyTest(v: string | undefined): boolean {
  if (v == null || v === "") return false;
  return v.trim().toLowerCase() === "test";
}

/** Server and client (NEXT_PUBLIC_*). */
export function isTestMode(): boolean {
  if (typeof process === "undefined") return false;
  return truthyTest(process.env.NEXT_PUBLIC_APP_MODE);
}

/** Prefer for client-only UI (same env var). */
export function isPublicTestMode(): boolean {
  return isTestMode();
}

/** Extra verbose logging (server): test mode or explicit flag. */
export function isVerboseTestLogging(): boolean {
  if (typeof process === "undefined") return false;
  return (
    isTestMode() ||
    process.env.TEST_MODE_VERBOSE_LOGS === "1" ||
    process.env.TEST_MODE_VERBOSE_LOGS?.toLowerCase() === "true"
  );
}
