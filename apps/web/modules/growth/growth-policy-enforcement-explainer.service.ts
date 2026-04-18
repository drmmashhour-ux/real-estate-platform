/**
 * Compact enforcement lines for panels and badges.
 */

import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";
import { getEnforcementForTarget } from "./growth-policy-enforcement-query.service";

export function buildGrowthPolicyEnforcementNotes(snapshot: GrowthPolicyEnforcementSnapshot): string[] {
  const out: string[] = [];

  const learn = getEnforcementForTarget("learning_adjustments", snapshot);
  if (learn.mode === "freeze") {
    out.push("Learning adjustments are frozen by policy enforcement.");
  }

  const ap = getEnforcementForTarget("autopilot_safe_execution", snapshot);
  if (ap.mode === "approval_required") {
    out.push("Autopilot safe execution remains approval-gated.");
  }

  const fus = getEnforcementForTarget("fusion_autopilot_bridge", snapshot);
  if (fus.mode === "advisory_only" || fus.mode === "freeze" || fus.mode === "block") {
    out.push("Fusion bridge outputs are advisory-only — not auto-promoted.");
  }

  const strat = getEnforcementForTarget("strategy_recommendation_promotion", snapshot);
  if (strat.mode !== "allow") {
    out.push("Strategy recommendations are not auto-promoted under current enforcement.");
  }

  const sim = getEnforcementForTarget("simulation_recommendation_promotion", snapshot);
  if (sim.mode !== "allow") {
    out.push("Simulation recommendations cannot be promoted automatically.");
  }

  return out.slice(0, 5);
}
