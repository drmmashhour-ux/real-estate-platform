/**
 * UAE (`apps/uae`) — APP_CONTEXT gate. Pair with other apps’ assertContext modules.
 */

export const ISOLATION_VIOLATION_MSG =
  "❌ Cross-app import detected: country apps must remain isolated";

/**
 * Ensures this Node process is marked for the UAE app when `APP_CONTEXT` is set.
 * Production requires `APP_CONTEXT=uae`.
 */
export function assertUaeRuntimeEnv(): void {
  const raw = process.env.APP_CONTEXT?.trim().toLowerCase();

  if (process.env.NODE_ENV === "production") {
    if (!raw || raw !== "uae") {
      throw new Error(`${ISOLATION_VIOLATION_MSG} — UAE production requires APP_CONTEXT=uae (apps/uae).`);
    }
    return;
  }

  if (raw && raw !== "uae") {
    throw new Error(`${ISOLATION_VIOLATION_MSG} — apps/uae expects APP_CONTEXT=uae, got "${raw}".`);
  }
}

export { assertUaeRuntimeEnv as assertAppContext };
