/**
 * Growth governance policy snapshot — advisory visibility only; v1 does not enforce runtime behavior.
 */

export type GrowthPolicyDomain =
  | "leads"
  | "ads"
  | "cro"
  | "content"
  | "messaging"
  | "autopilot"
  | "learning"
  | "fusion";

export type GrowthPolicyMode =
  | "allowed"
  | "advisory_only"
  | "approval_required"
  | "blocked"
  | "frozen";

export type GrowthGovernancePolicyRuleSource =
  | "default_policy"
  | "governance"
  | "learning_control"
  | "manual";

export type GrowthGovernancePolicyRule = {
  id: string;
  domain: GrowthPolicyDomain;
  actionType?: string;
  mode: GrowthPolicyMode;
  rationale: string;
  source: GrowthGovernancePolicyRuleSource;
  createdAt: string;
};

export type GrowthGovernancePolicySnapshot = {
  rules: GrowthGovernancePolicyRule[];
  blockedDomains: GrowthPolicyDomain[];
  frozenDomains: GrowthPolicyDomain[];
  reviewRequiredDomains: GrowthPolicyDomain[];
  notes: string[];
  createdAt: string;
};
