/**
 * Revenue Enforcement V1 — env toggles (default off). Reversible via env only.
 */

function envTrue(k: string): boolean {
  return process.env[k] === "true" || process.env[k] === "1";
}

/** Master switch: tracking + guard evaluation (soft block optional). */
export function isRevenueEnforcementV1Enabled(): boolean {
  return envTrue("FEATURE_REVENUE_ENFORCEMENT_V1");
}

/** Growth dashboard panel for in-memory enforcement metrics. */
export function isRevenueDashboardV1Enabled(): boolean {
  return envTrue("FEATURE_REVENUE_DASHBOARD_V1");
}

/**
 * When enforcement is on and the user has no active subscription / bypass,
 * returning false from the guard will soft-block lead unlock checkout only if this is true.
 * Default off — guard still returns structured reasons for logging.
 */
export function isRevenueEnforcementBlockCheckoutEnabled(): boolean {
  return envTrue("REVENUE_ENFORCEMENT_BLOCK_CHECKOUT");
}

/** Comma-separated user ids that always pass the guard (dev/staging). */
export function getRevenueEnforcementDevBypassUserIds(): Set<string> {
  const raw = process.env.REVENUE_ENFORCEMENT_DEV_BYPASS_USER_IDS?.trim() ?? "";
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
