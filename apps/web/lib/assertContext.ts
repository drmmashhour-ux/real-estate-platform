/**
 * LECIPM (`apps/web`) — APP_CONTEXT gate. Pair with `apps/syria/src/lib/assertContext.ts`.
 */

/** Align with `rules/isolation-constants.mjs`. */
export const ISOLATION_VIOLATION_MSG =
  "❌ Cross-app import detected: This breaks Darlink/LECIPM isolation";

/**
 * Ensures this Node process is marked as LECIPM web when `APP_CONTEXT` is set.
 * Production requires `APP_CONTEXT=lecipm`.
 */
export function assertLecipmRuntimeEnv(): void {
  const raw = process.env.APP_CONTEXT?.trim().toLowerCase();

  if (process.env.NODE_ENV === "production") {
    if (!raw || raw !== "lecipm") {
      throw new Error(`${ISOLATION_VIOLATION_MSG} — LECIPM production requires APP_CONTEXT=lecipm (apps/web).`);
    }
    return;
  }

  if (raw && raw !== "lecipm") {
    throw new Error(`${ISOLATION_VIOLATION_MSG} — apps/web expects APP_CONTEXT=lecipm, got "${raw}".`);
  }
}

export { assertLecipmRuntimeEnv as assertAppContext };
