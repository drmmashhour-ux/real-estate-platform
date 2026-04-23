import { DEFAULT_HUB_STRATEGIC_PRIORITY } from "./growth-brain.config";
import type { AllocationRecommendation, AllocationSlice, GrowthDomain, GrowthOpportunity } from "./growth-brain.types";

function domainBucket(d: GrowthDomain): keyof typeof DEFAULT_HUB_STRATEGIC_PRIORITY | "default" {
  switch (d) {
    case "BNHUB":
      return "bnhub";
    case "BROKER":
      return "broker";
    case "INVESTOR":
      return "investor";
    case "RESIDENCE":
      return "residence";
    case "MARKETING":
      return "marketing";
    default:
      return "default";
  }
}

/** Strategic attention allocator — percentages are guidance only (not automated spend). */
export function allocateAttention(
  opportunities: GrowthOpportunity[],
  regions?: string[]
): AllocationRecommendation {
  const hubs = DEFAULT_HUB_STRATEGIC_PRIORITY;
  const weights = new Map<string, number>();

  for (const o of opportunities.slice(0, 12)) {
    const key = domainBucket(o.domain);
    const base =
      key === "default"
        ? hubs.marketing
        : hubs[key as keyof typeof hubs];
    const w = base * (0.5 + o.priorityScore);
    weights.set(o.domain, (weights.get(o.domain) ?? 0) + w);
  }

  if (weights.size === 0) {
    const slices: AllocationSlice[] = [
      {
        label: "BNHub demand",
        percent: 40,
        domain: "BNHUB",
        region: regions?.[0],
        rationale: "Default weekly balance — tune once live signals populate.",
        expectedImpact: 0.55,
        confidence: 0.45,
      },
      {
        label: "Broker acquisition",
        percent: 25,
        domain: "BROKER",
        rationale: "Maintain broker pipeline rhythm.",
        expectedImpact: 0.52,
        confidence: 0.48,
      },
      {
        label: "Investor content",
        percent: 20,
        domain: "INVESTOR",
        rationale: "Compound investor SERP lanes.",
        expectedImpact: 0.5,
        confidence: 0.46,
      },
      {
        label: "Retention / reactivation",
        percent: 15,
        domain: "MARKETING",
        rationale: "Lifecycle touches for stalled leads.",
        expectedImpact: 0.45,
        confidence: 0.44,
      },
    ];
    return {
      slices,
      headline: "Baseline allocation until opportunity signals converge.",
      generatedAtIso: new Date().toISOString(),
    };
  }

  const entries = [...weights.entries()].sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((s, [, v]) => s + v, 0) || 1;
  let remaining = 100;
  const slices: AllocationSlice[] = entries.map(([domain, val], i) => {
    const pct =
      i === entries.length - 1
        ? remaining
        : Math.round((100 * val) / sum / 5) * 5;
    remaining -= pct;
    return {
      label: `${domain} cluster`,
      percent: Math.max(5, pct),
      domain: domain as GrowthDomain,
      region: regions?.[0],
      rationale: `Weighted by strategic hub priority × ranked opportunity scores for ${domain}.`,
      expectedImpact:
        opportunities.filter((o) => o.domain === domain)[0]?.expectedImpact ?? 0.5,
      confidence:
        opportunities.filter((o) => o.domain === domain)[0]?.confidence ?? 0.55,
    };
  });

  const norm = slices.reduce((s, x) => s + x.percent, 0) || 1;
  for (const s of slices) {
    s.percent = Math.round((s.percent / norm) * 100);
  }

  return {
    slices,
    headline: "Shift attention toward domains with highest composite opportunity scores.",
    generatedAtIso: new Date().toISOString(),
  };
}
