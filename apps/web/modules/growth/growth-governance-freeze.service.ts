/**
 * Advisory-only freeze hints — does not toggle feature flags or disable systems.
 */

import type {
  GrowthGovernanceDecision,
  GrowthGovernanceDomain,
  GrowthGovernanceFreezeState,
  GrowthGovernanceStatus,
} from "./growth-governance.types";

function freezeTier(status: GrowthGovernanceStatus): "none" | "light" | "strong" {
  if (status === "healthy") return "none";
  if (status === "watch") return "light";
  if (status === "caution") return "light";
  if (status === "freeze_recommended") return "strong";
  return "strong";
}

/**
 * Derives which domains are frozen / blocked for *advisory* scaling (labels only — no runtime mutation).
 *
 * Mapping (advisory):
 * - `healthy` → no freeze labels; pass-through blocked domains from decision only.
 * - `watch` / `caution` → light hold on paid surface (`ads`).
 * - `freeze_recommended` / `human_review_required` → strong hold on scaling narratives across ads, CRO, content,
 *   fusion cross-signals, and autopilot advisory expansion — does not execute or toggle product flags.
 */
export function getGrowthFreezeState(decision: GrowthGovernanceDecision): GrowthGovernanceFreezeState {
  const tier = freezeTier(decision.status);
  const blockedDomains: GrowthGovernanceDomain[] = [...decision.blockedDomains];
  const frozenDomains: GrowthGovernanceDomain[] = [];
  const rationale: string[] = [];

  if (tier === "none") {
    rationale.push("No advisory freeze — operate within existing approvals and policy.");
    return {
      frozenDomains,
      blockedDomains,
      rationale,
    };
  }

  if (tier === "light") {
    frozenDomains.push("ads");
    rationale.push("Light hold: validate UTM and creative before increasing paid surface area.");
    return {
      frozenDomains,
      blockedDomains,
      rationale,
    };
  }

  frozenDomains.push("ads", "cro", "content", "fusion", "autopilot");
  rationale.push(
    "Strong advisory freeze: treat scaling, CRO influence, content expansion, fusion synthesis, and autopilot escalation as read-only until review.",
  );
  if (decision.status === "human_review_required") {
    rationale.push("Human review required — reconcile capacity, policy, and blocked domains before promoting automation.");
  } else {
    rationale.push("Fusion cross-signals may be unreliable — confirm telemetry before trusting priorities.");
  }
  return {
    frozenDomains,
    blockedDomains,
    rationale,
  };
}

/** @deprecated Use GrowthGovernanceFreezeState */
export type GrowthFreezeState = GrowthGovernanceFreezeState;
