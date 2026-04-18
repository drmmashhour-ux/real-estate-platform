/**
 * Darlink runtime guards — Syria app lane only.
 * Never pass end-user listing descriptions through assertDarlinkContext(); use it for internal labels/env only.
 */

export const ISOLATION_VIOLATION_MSG =
  "❌ Cross-app import detected: country apps must remain isolated";

const FORBIDDEN_CROSS_PLATFORM = ["quebec", "oaciq", "lecipm"] as const;

/**
 * Validates internal diagnostics (feature keys, migrations notes, logging tags).
 * Do **not** use with arbitrary user-entered listing copy.
 */
export function assertDarlinkContext(context: string): void {
  const lower = context.toLowerCase().normalize("NFKC");
  for (const token of FORBIDDEN_CROSS_PLATFORM) {
    if (lower.includes(token)) {
      throw new Error(`${ISOLATION_VIOLATION_MSG} — forbidden token (${token})`);
    }
  }
}

/**
 * Ensures deployment identity for Darlink when `APP_CONTEXT` is supplied.
 * - Production (`NODE_ENV === "production"`): requires `APP_CONTEXT=darlink`.
 * - Non-production: if unset, OK; if set, must be `darlink`.
 */
export function assertDarlinkRuntimeEnv(): void {
  const raw = process.env.APP_CONTEXT?.trim().toLowerCase();

  if (process.env.NODE_ENV === "production") {
    if (!raw || raw !== "darlink") {
      throw new Error(`${ISOLATION_VIOLATION_MSG} — Darlink production requires APP_CONTEXT=darlink (apps/syria).`);
    }
    return;
  }

  if (raw && raw !== "darlink") {
    throw new Error(
      `${ISOLATION_VIOLATION_MSG} — apps/syria expects APP_CONTEXT=darlink, got "${raw}".`,
    );
  }
}
