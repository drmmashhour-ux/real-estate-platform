import type {
  DynamicPricingDecision,
  DynamicPricingInput,
  AutonomyPolicyResult,
} from "../types/autonomy.types";

import { isAutonomyOsDynamicPricingEnabled } from "../lib/autonomy-layer-gate";
import { evaluateAutonomyPolicies } from "../policy/autonomy-policy.service";

function clamp(value: number, min?: number, max?: number): number {
  let result = value;
  if (typeof min === "number") result = Math.max(min, result);
  if (typeof max === "number") result = Math.min(max, result);
  return result;
}

export function buildDynamicPricingDecision(
  input: DynamicPricingInput,
  mode: "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT_APPROVAL",
): DynamicPricingDecision {
  const disabled: AutonomyPolicyResult[] = [
    {
      id: "feature-gate-off",
      domain: "PRICING",
      severity: "WARNING",
      allowed: false,
      requiresHumanApproval: false,
      reason:
        "Autonomy OS core or FEATURE_DYNAMIC_PRICING_V1 is disabled — advisory pricing engine returns base price only.",
    },
  ];

  if (!isAutonomyOsDynamicPricingEnabled()) {
    return {
      listingId: input.listingId,
      suggestedPrice: input.basePrice,
      confidence: 0,
      factors: ["Pricing layer gated off by feature flags."],
      deltaFromBase: 0,
      shouldAutoApply: false,
      policyResults: disabled,
      createdAt: new Date().toISOString(),
    };
  }

  const factors: string[] = [];
  let multiplier = 1;

  if ((input.occupancyRate ?? 0) > 0.8) {
    multiplier += 0.1;
    factors.push("High occupancy supports higher pricing.");
  }

  if ((input.bookingVelocity ?? 0) > 0.7) {
    multiplier += 0.08;
    factors.push("Strong booking velocity detected.");
  }

  if ((input.localDemandIndex ?? 0) > 0.7) {
    multiplier += 0.07;
    factors.push("Local demand index is elevated.");
  }

  if ((input.seasonalityIndex ?? 0) > 0.7) {
    multiplier += 0.05;
    factors.push("Seasonality trend is favorable.");
  }

  if ((input.localDemandIndex ?? 0) < 0.35) {
    multiplier -= 0.06;
    factors.push("Local demand is weaker than normal.");
  }

  if (
    typeof input.competitorMedianPrice === "number" &&
    input.basePrice > input.competitorMedianPrice
  ) {
    multiplier -= 0.04;
    factors.push("Base price exceeds competitor median.");
  }

  if (input.activePromotion) {
    multiplier -= 0.03;
    factors.push("Active promotion reduces target price slightly.");
  }

  const suggestedRaw = input.basePrice * multiplier;
  const suggestedPrice = clamp(Math.round(suggestedRaw), input.minPrice, input.maxPrice);

  const deltaPercent =
    input.basePrice > 0 ? ((suggestedPrice - input.basePrice) / input.basePrice) * 100 : 0;

  const policy = evaluateAutonomyPolicies({
    mode,
    domain: "PRICING",
    payload: {
      listingId: input.listingId,
      deltaPercent,
    },
    estimatedImpact: {
      revenue: Math.max(0, suggestedPrice - input.basePrice) * 30,
    },
  });

  return {
    listingId: input.listingId,
    suggestedPrice,
    confidence: Math.max(0.35, Math.min(0.95, 0.5 + factors.length * 0.08)),
    factors,
    deltaFromBase: suggestedPrice - input.basePrice,
    shouldAutoApply:
      policy.allowed && !policy.requiresHumanApproval && mode === "SAFE_AUTOPILOT",
    policyResults: policy.results,
    createdAt: new Date().toISOString(),
  };
}
