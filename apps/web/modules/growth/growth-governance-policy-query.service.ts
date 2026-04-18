/**
 * Shared read-only policy lookups — deterministic, no mutation.
 */

import type {
  GrowthGovernancePolicySnapshot,
  GrowthPolicyDomain,
  GrowthPolicyMode,
} from "./growth-governance-policy.types";

export function getPolicyModeForDomain(
  domain: GrowthPolicyDomain,
  snapshot: GrowthGovernancePolicySnapshot,
): GrowthPolicyMode | undefined {
  const r = snapshot.rules.find((x) => x.domain === domain);
  return r?.mode;
}

export function isDomainBlocked(domain: GrowthPolicyDomain, snapshot: GrowthGovernancePolicySnapshot): boolean {
  return snapshot.blockedDomains.includes(domain);
}

export function isDomainFrozen(domain: GrowthPolicyDomain, snapshot: GrowthGovernancePolicySnapshot): boolean {
  return snapshot.frozenDomains.includes(domain);
}

export function requiresHumanReview(domain: GrowthPolicyDomain, snapshot: GrowthGovernancePolicySnapshot): boolean {
  return snapshot.reviewRequiredDomains.includes(domain);
}

/** Short UI label for badges (display-only). */
export function formatPolicyModeLabel(mode: GrowthPolicyMode | undefined): string {
  if (!mode) return "—";
  switch (mode) {
    case "allowed":
      return "Allowed";
    case "advisory_only":
      return "Advisory only";
    case "approval_required":
      return "Approval required";
    case "blocked":
      return "Blocked";
    case "frozen":
      return "Frozen";
    default:
      return mode;
  }
}
