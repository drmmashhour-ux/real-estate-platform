/**
 * Advisory-only experiment bundle — compares pricing postures side-by-side; nothing is persisted except via operator overrides API.
 */

import type { DynamicPricingSuggestion } from "@/modules/leads/dynamic-pricing.types";
import type { LeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.types";
import type { LeadQualitySummary } from "@/modules/leads/lead-quality.types";
import { computeLeadPricingExperimentMode } from "@/modules/leads/lead-pricing-experiment-modes.service";
import type {
  LeadPricingComparisonSummary,
  LeadPricingExperimentMode,
  LeadPricingExperimentResult,
  LeadPricingOverride,
} from "@/modules/leads/lead-pricing-experiments.types";
import {
  monitorDisplayPrecedence,
  monitorExperimentBundleBuilt,
  monitorLowConfidenceCase,
} from "@/modules/leads/lead-pricing-experiments-monitoring.service";
import { resolveInternalLeadPricingDisplay } from "@/modules/leads/lead-pricing-display.service";

export type BuildLeadPricingExperimentsInput = {
  leadId: string;
  basePrice: number;
  monetization: LeadMonetizationControlSummary;
  /** Echo inputs for explainability hooks — experiments reuse monetization-derived context only. */
  quality: LeadQualitySummary | null | undefined;
  dynamic: DynamicPricingSuggestion | null | undefined;
  historicalConversion?: number | null;
};

const EXPERIMENT_MODES_ORDER: LeadPricingExperimentMode[] = [
  "baseline",
  "quality_weighted",
  "demand_weighted",
  "conservative",
  "aggressive",
];

export function buildLeadPricingExperiments(input: BuildLeadPricingExperimentsInput): LeadPricingExperimentResult[] {
  void input.quality;
  void input.dynamic;

  const results = EXPERIMENT_MODES_ORDER.map((mode) =>
    computeLeadPricingExperimentMode(mode, {
      basePrice: input.basePrice,
      monetization: input.monetization,
      historicalConversion: input.historicalConversion,
    }),
  );

  let lowConfidenceModes = 0;
  if (input.monetization.confidenceLevel === "low") {
    lowConfidenceModes = results.length;
    for (const r of results) {
      monitorLowConfidenceCase({
        leadId: input.leadId,
        mode: r.mode,
        detail: "bundle_low_confidence",
      });
    }
  }

  monitorExperimentBundleBuilt({
    leadId: input.leadId,
    modes: results.length,
    lowConfidenceModes,
  });

  return results;
}

export function buildLeadPricingComparisonSummary(input: {
  leadId: string;
  monetization: LeadMonetizationControlSummary;
  experimentResults: LeadPricingExperimentResult[];
  activeOverride: LeadPricingOverride | null;
}): LeadPricingComparisonSummary {
  const basePrice = input.monetization.basePrice;
  const internal = resolveInternalLeadPricingDisplay({
    basePrice,
    monetizationSuggestedPrice: input.monetization.suggestedPrice,
    activeOverride: input.activeOverride,
  });

  monitorDisplayPrecedence({
    leadId: input.leadId,
    precedence: internal.precedence,
    effectiveAdvisoryPrice: internal.effectiveAdvisoryPrice,
  });

  return {
    leadId: input.leadId,
    basePrice,
    primarySuggestedPrice: input.monetization.suggestedPrice,
    experimentResults: input.experimentResults,
    activeOverride: input.activeOverride ?? undefined,
    selectedDisplayMode: internal.precedence,
    explanation: internal.explanation,
  };
}
