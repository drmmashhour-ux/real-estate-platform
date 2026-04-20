/**
 * Policy action bridge — navigation + guidance only; no mutations or autonomous execution.
 */

import type { GrowthPolicyDomain, GrowthPolicySeverity } from "@/modules/growth/policy/growth-policy.types";

export type GrowthPolicyActionType =
  | "navigate"
  | "inspect"
  | "review"
  | "compare"
  | "resolve_manually";

export type GrowthPolicyAction = {
  id: string;
  policyId: string;
  domain: GrowthPolicyDomain;
  severity: GrowthPolicySeverity;
  title: string;
  resolutionLabel: string;
  rationale: string;
  /** Stable surface token — resolved client-side with locale/country into an href + hash. */
  targetSurface: string;
  actionType: GrowthPolicyActionType;
  queryParams?: Record<string, string>;
  notes: string[];
};

export type GrowthPolicyActionBundle = {
  actions: GrowthPolicyAction[];
  topAction?: GrowthPolicyAction;
  generatedAt: string;
};
