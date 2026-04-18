/**
 * Deterministic short explanations for operator readout — advisory framing only.
 */

import type { DynamicPricingSuggestion } from "@/modules/leads/dynamic-pricing.types";
import type { LeadQualitySummary } from "@/modules/leads/lead-quality.types";
import type {
  LeadMonetizationConfidenceLevel,
  LeadMonetizationPriceSourceMode,
  LeadMonetizationReason,
} from "@/modules/leads/lead-monetization-control.types";

export function buildLeadMonetizationReasons(input: {
  mode: LeadMonetizationPriceSourceMode;
  basePrice: number;
  suggestedPrice: number;
  leadQuality?: LeadQualitySummary | null;
  dynamicPricing?: DynamicPricingSuggestion | null;
  demandLevel?: "low" | "medium" | "high";
  demandScore?: number;
  brokerInterestLevel?: number;
  confidenceLevel: LeadMonetizationConfidenceLevel;
}): LeadMonetizationReason[] {
  const out: LeadMonetizationReason[] = [];

  out.push({
    type: "conservative_cap",
    label: "Base price (revenue engine)",
    description: `Reference unlock anchor is $${Math.round(input.basePrice)} CAD from existing pricing rules — advisory layers sit on top; checkout is unchanged.`,
  });

  if (input.mode === "dynamic_advisory" && input.dynamicPricing) {
    out.push({
      type: "demand",
      label: "Dynamic advisory layer",
      description: `Primary advisory suggestion uses demand, quality score, and broker-interest multipliers (capped) on the base price — suggested $${input.suggestedPrice} CAD.`,
    });
    if (input.demandLevel === "high") {
      out.push({
        type: "demand",
        label: "Demand signal",
        description: "High recent demand signals support a higher advisory range — still not a guaranteed market price.",
      });
    } else if (input.demandLevel === "medium") {
      out.push({
        type: "demand",
        label: "Demand signal",
        description: "Demand is moderate — advisory uplift is tempered.",
      });
    }
  } else if (input.mode === "quality_advisory" && input.leadQuality) {
    out.push({
      type: "quality",
      label: "Quality advisory layer",
      description: `Quality band ${input.leadQuality.band} suggests $${input.suggestedPrice} CAD as a separate advisory figure — dynamic pricing was unavailable.`,
    });
  } else {
    out.push({
      type: "sparse_data",
      label: "Advisory layers limited",
      description:
        "Showing revenue-engine base only as the unified suggestion — enable quality and/or dynamic pricing for richer advisory context.",
    });
  }

  if (input.leadQuality && input.mode !== "quality_advisory") {
    out.push({
      type: "quality",
      label: "Lead quality context",
      description: `Quality score ${input.leadQuality.score} (${input.leadQuality.band}) informs dynamic pricing when that layer is active.`,
    });
  }

  if (typeof input.brokerInterestLevel === "number") {
    const tier =
      input.brokerInterestLevel >= 70 ? "strong" : input.brokerInterestLevel >= 45 ? "moderate" : "light";
    out.push({
      type: "broker_interest",
      label: "Broker interest",
      description:
        tier === "strong"
          ? "Broker interest / routing signals are relatively strong."
          : tier === "moderate"
            ? "Broker interest is moderate."
            : "Broker interest signals are light — treat uplift cautiously.",
    });
  }

  if (input.confidenceLevel === "low") {
    out.push({
      type: "sparse_data",
      label: "Low confidence",
      description: "Sparse or conflicting signals — prefer conservative interpretation; verify with your playbook.",
    });
  }

  return out.slice(0, 12);
}

export function buildLeadMonetizationExplanation(input: {
  mode: LeadMonetizationPriceSourceMode;
  suggestedPrice: number;
  basePrice: number;
  confidenceLevel: LeadMonetizationConfidenceLevel;
}): string {
  const adv = `Suggested price (advisory): $${input.suggestedPrice} CAD`;
  if (input.mode === "dynamic_advisory") {
    return `${adv}. The dynamic layer is the primary advisory source on top of a $${Math.round(input.basePrice)} CAD revenue-engine base. Confidence is ${input.confidenceLevel} — this is not a quote, commitment, or automatic charge.`;
  }
  if (input.mode === "quality_advisory") {
    return `${adv} from the quality model alone (dynamic pricing unavailable). Base reference remains $${Math.round(input.basePrice)} CAD. Confidence is ${input.confidenceLevel}.`;
  }
  return `Base price $${Math.round(input.basePrice)} CAD is the only unified figure here; enable quality/dynamic flags for layered advisory guidance. Confidence is ${input.confidenceLevel}.`;
}
