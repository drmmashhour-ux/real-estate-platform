/**
 * Safe navigation only — query params + in-app hashes; never triggers mutations.
 */

import type { GrowthPolicyDomain } from "@/modules/growth/policy/growth-policy.types";

/** Growth Machine section anchors (must exist on dashboard/growth child components). */
export const POLICY_DOMAIN_SECTION_HASH: Record<GrowthPolicyDomain, string> = {
  governance: "growth-mc-policy-enforcement",
  ads: "growth-mc-executive",
  cro: "growth-mc-fusion",
  leads: "growth-mc-team-coordination",
  messaging: "growth-mc-policy-enforcement",
  content: "growth-mc-learning",
  pricing: "growth-mc-revenue",
  broker: "growth-mc-broker-closing",
};

export function buildGrowthPolicyDashboardHref(params: {
  locale: string;
  country: string;
  domain: GrowthPolicyDomain;
  policyId: string;
  extra?: Record<string, string>;
  /** Optional query keys merged last (e.g. from `GrowthPolicyAction.queryParams`). */
  queryMerge?: Record<string, string>;
  /** Secondary review surface on the growth dashboard (same page, different anchor). */
  hashOverride?: string;
}): string {
  const hash = params.hashOverride ?? POLICY_DOMAIN_SECTION_HASH[params.domain];
  const qs = new URLSearchParams({
    from: "growth-policy",
    policyId: params.policyId,
    ...(params.extra ?? {}),
    ...(params.queryMerge ?? {}),
  });
  const base = `/${params.locale}/${params.country}/dashboard/growth`;
  return `${base}?${qs.toString()}${hash ? `#${hash}` : ""}`;
}

/** Deeper console / alternate review anchor when “Review” should differ from “Open”. */
export function growthPolicyReviewHashOverride(domain: GrowthPolicyDomain): string | undefined {
  if (domain === "governance") return "growth-mc-governance-console";
  return undefined;
}

/** Secondary admin surface for broker-heavy findings — still read/navigation oriented. */
export function buildGrowthPolicyBrokerTeamHref(params: {
  locale: string;
  country: string;
  policyId: string;
}): string {
  const qs = new URLSearchParams({
    from: "growth-policy",
    policyId: params.policyId,
  });
  return `/${params.locale}/${params.country}/admin/broker-team?${qs.toString()}`;
}
