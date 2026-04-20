/**
 * Cross-region advisory domination layer — deterministic; no writes.
 */
import { REGION_REGISTRY } from "@lecipm/platform-core";
import { engineFlags } from "@/config/feature-flags";
import { buildDominationSummary } from "@/modules/market-domination/growth-domination.service";
import { getGlobalUnifiedIntelligenceSnapshot } from "@/modules/global-intelligence/global-unified-intelligence.service";
import { getJurisdictionPolicyPack } from "@/modules/legal/jurisdiction/jurisdiction-policy-pack-registry";

export type GlobalDominationWire = {
  freshness: string;
  perRegionSignals: Array<{
    regionCode: string;
    rankingLiftHint: boolean;
    pricingVarianceHint: boolean;
    expansionScore: number;
    notes: readonly string[];
  }>;
  advisoryNotes: readonly string[];
};

export async function buildGlobalDominationSummary(): Promise<GlobalDominationWire | null> {
  if (!engineFlags.globalDominationV1) {
    return null;
  }
  const freshness = new Date().toISOString();
  const advisoryNotes: string[] = [];
  let tagCount = 0;
  try {
    const g = await getGlobalUnifiedIntelligenceSnapshot();
    tagCount = g.syria.trustRisk.normalizedRiskTags.length;
  } catch {
    advisoryNotes.push("syria_intel_snapshot_partial");
  }

  const dom = buildDominationSummary({
    trustScoreHint: tagCount > 2 ? 55 : 70,
    legalRiskScoreHint: 28,
  });

  const rows: NonNullable<GlobalDominationWire>["perRegionSignals"] = [];

  for (const r of REGION_REGISTRY) {
    const pack = getJurisdictionPolicyPack(r.code);
    const base = dom.ranking.length > 0 || dom.pricing.length > 0;
    rows.push({
      regionCode: r.code,
      rankingLiftHint: base && pack.rankingRulesEnabled,
      pricingVarianceHint: dom.pricing.length > 0,
      expansionScore: Math.min(
        100,
        pack.trustRulesEnabled ? 72 : 48,
      ),
      notes: [...pack.notes],
    });
  }

  rows.sort((a, b) => a.regionCode.localeCompare(b.regionCode));

  return {
    freshness,
    perRegionSignals: rows,
    advisoryNotes: [...advisoryNotes, "cross_region_signals_advisory_only"].sort(),
  };
}

export function buildCrossRegionExpansionTargets(): {
  targets: Array<{ regionCode: string; rationale: string }>;
  notes: readonly string[];
} {
  const targets = REGION_REGISTRY.filter((r) => r.capabilities.bnhub === true || r.capabilities.shortTermRentalFlow === true).map(
    (r) => ({
      regionCode: r.code,
      rationale: `Capability-led expansion candidate — bnhub:${r.capabilities.bnhub}, str:${r.capabilities.shortTermRentalFlow}`,
    }),
  );
  targets.sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return { targets, notes: ["deterministic_priority_no_automated_rollout"] };
}

export function buildCrossRegionPricingSignals(): {
  rows: Array<{ regionCode: string; differentialHint: number }>;
  notes: readonly string[];
} {
  const rows = REGION_REGISTRY.map((r, i) => ({
    regionCode: r.code,
    differentialHint: (i + 7) % 23,
  })).sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return { rows, notes: ["bounded_numeric_hints_only"] };
}

export async function buildCrossRegionTrustLeverageSummary(): Promise<{
  rows: Array<{ regionCode: string; leverageHint: boolean; notes: readonly string[] }>;
  freshness: string;
}> {
  const freshness = new Date().toISOString();
  const snap = await getGlobalUnifiedIntelligenceSnapshot().catch(() => null);
  const rows = REGION_REGISTRY.map((r) => ({
    regionCode: r.code,
    leverageHint: Boolean(r.capabilities.trustScoring && snap?.syria.regionSummary),
    notes:
      r.code === "sy"
        ? (snap?.syria.availabilityNotes ?? [])
        : ["trust_leverage_advisory_only"],
  })).sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return { rows, freshness };
}
