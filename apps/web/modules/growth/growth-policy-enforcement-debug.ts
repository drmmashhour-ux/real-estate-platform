/**
 * Debug / operator instrumentation for policy enforcement rollout (query-param gated on the API).
 */

export const GROWTH_POLICY_DEBUG_QUERY = "growthPolicyDebug" as const;

/** API: include operational monitoring + debug counts when this query param is present (client adds it when UI allows). */
export function policyEnforcementApiRequestHasDebug(req: Request): boolean {
  try {
    const url = new URL(req.url);
    return url.searchParams.get(GROWTH_POLICY_DEBUG_QUERY) === "1";
  } catch {
    return false;
  }
}

/**
 * Client may show debug surfaces when non-production, env is set, or URL contains `?growthPolicyDebug=1`.
 * Production requires env or URL — never implicit.
 */
export function shouldShowGrowthPolicyEnforcementDebugUi(searchParamsGrowthPolicyDebug?: string | null): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    return true;
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GROWTH_POLICY_ENFORCEMENT_DEBUG === "1") {
    return true;
  }
  if (searchParamsGrowthPolicyDebug === "1") {
    return true;
  }
  return false;
}
