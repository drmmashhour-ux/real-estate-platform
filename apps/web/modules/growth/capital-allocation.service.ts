/**
 * Advisory allocation plan — deterministic ranking; does not execute spend or transfers.
 */

import { buildScalePlan } from "@/modules/growth/scale-system.service";
import { computeAllocationPriority } from "@/modules/growth/capital-allocation-scoring.service";
import {
  classifyCityBucket,
  classifySystemBrokerBucket,
} from "@/modules/growth/capital-allocation-rules.service";
import {
  collectCapitalAllocationSignals,
  type NormalizedCitySignals,
} from "@/modules/growth/capital-allocation-signals.service";
import { buildCapitalAllocationInsights } from "@/modules/growth/capital-allocation-insights.service";
import { recordCapitalAllocationPlan } from "@/modules/growth/capital-allocation-monitoring.service";
import type {
  CapitalAllocationBucket,
  CapitalAllocationBucketId,
  CapitalAllocationPlan,
  CapitalAllocationRecommendation,
  EffortLevel,
} from "@/modules/growth/capital-allocation.types";
import type { MarketExpansionCandidate } from "@/modules/growth/market-expansion.types";

const BUCKETS: Record<CapitalAllocationBucketId, CapitalAllocationBucket> = {
  city_execution: {
    id: "city_execution",
    label: "Scale winners",
    description: "Double down where logged execution ratios already validate demand capture.",
  },
  city_expansion: {
    id: "city_expansion",
    label: "Expand",
    description: "Adjacent markets that appear ready using similarity + demand/supply proxies.",
  },
  conversion_optimization: {
    id: "conversion_optimization",
    label: "Fix conversion",
    description: "Improve playbook completion before scaling traffic where capture exists but progression lags.",
  },
  broker_acquisition: {
    id: "broker_acquisition",
    label: "Build supply",
    description: "Increase broker/listing density where monetization signals are thin or competition data is sparse.",
  },
  hold: {
    id: "hold",
    label: "Hold",
    description: "Defer emphasis until attribution sample size or cross-signal agreement improves.",
  },
};

function effortFromScore(priorityScore: number): EffortLevel {
  if (priorityScore >= 75) return "high";
  if (priorityScore >= 52) return "medium";
  return "low";
}

function mergeConfidence(
  a: CapitalAllocationRecommendation["confidence"],
  b: CapitalAllocationRecommendation["confidence"],
): CapitalAllocationRecommendation["confidence"] {
  const rank = { low: 0, medium: 1, high: 2 };
  return rank[a] <= rank[b] ? a : b;
}

function expansionCandidateForCity(
  city: string,
  top: MarketExpansionCandidate[] | undefined,
): MarketExpansionCandidate | undefined {
  return top?.find((c) => c.city === city);
}

function competitionPressureForCity(
  norm: NormalizedCitySignals,
  expansionTop: MarketExpansionCandidate[] | undefined,
  globalBrokerInsufficientRatio: number | undefined,
): number | undefined {
  const ec = expansionCandidateForCity(norm.city, expansionTop);
  if (ec?.competitionSignal != null && Number.isFinite(ec.competitionSignal)) {
    return Math.min(1, Math.max(0, ec.competitionSignal / 10));
  }
  return globalBrokerInsufficientRatio;
}

export async function buildCapitalAllocationPlan(windowDays = 14): Promise<CapitalAllocationPlan> {
  const snapshot = await collectCapitalAllocationSignals(windowDays);
  const { plan: scalePlan } = buildScalePlan();
  const leadsRow = snapshot.scale.find((s) => s.targetType === "leads");
  const brokersRow = snapshot.scale.find((s) => s.targetType === "brokers");

  let scaleGapLeads: number | undefined;
  if (leadsRow && scalePlan.requiredLeads > 0) {
    scaleGapLeads = Math.min(
      1,
      Math.max(0, (scalePlan.requiredLeads - leadsRow.currentValue) / scalePlan.requiredLeads),
    );
  }

  const insufficientBrokers = snapshot.brokers.filter((b) => b.outcomeBand === "insufficient_data").length;
  const brokerRatio =
    snapshot.brokers.length > 0 ? insufficientBrokers / snapshot.brokers.length : undefined;

  const expansionTop = snapshot.expansion?.topCandidates;

  const candidates: Omit<CapitalAllocationRecommendation, "allocationShare">[] = [];

  const supportingForCity = (norm: NormalizedCitySignals, bucket: CapitalAllocationBucketId): string[] => {
    const out: string[] = [];
    if (norm.performanceScore != null) out.push(`City comparison score=${norm.performanceScore}`);
    if (norm.executionStrength != null) out.push(`Execution blend≈${norm.executionStrength.toFixed(2)}`);
    if (norm.growthPotential != null) out.push(`Expansion score proxy=${norm.growthPotential.toFixed(2)}`);
    if (snapshot.weekly?.performance.topCity === norm.city) out.push("Weekly review flagged this city as top (bundle).");
    if (snapshot.weekly?.performance.weakestCity === norm.city) out.push("Weekly review flagged this city as weakest (bundle).");
    if (bucket === "broker_acquisition" && brokerRatio != null) {
      out.push(`Broker competition insufficient-data ratio≈${brokerRatio.toFixed(2)}`);
    }
    if (leadsRow) out.push(`Scale leads gap vs plan target encoded in priority (window ${windowDays}d).`);
    return out.slice(0, 8);
  };

  const risksDefault =
    "Signals are correlational window snapshots; they do not guarantee future outcomes or ROI.";

  for (const norm of snapshot.citiesNormalized) {
    const { bucket: bid, reasons } = classifyCityBucket(norm);
    const comp = competitionPressureForCity(norm, expansionTop, brokerRatio);
    const scored = computeAllocationPriority({
      performanceScore: norm.performanceScore,
      growthPotential: norm.growthPotential,
      executionStrength: norm.executionStrength,
      scaleGapLeads,
      competitionPressure: comp,
      dataTier: norm.dataTier,
    });

    let priorityScore = scored.priorityScore;
    let confidence = scored.confidence;
    const warnings = [...scored.warnings];
    if (
      norm.performanceScore != null &&
      norm.performanceScore >= 62 &&
      norm.executionStrength != null &&
      norm.executionStrength < 0.28
    ) {
      priorityScore = Math.round(priorityScore * 0.92);
      warnings.push("Performance tier and logged execution blend disagree — verify instrumentation before scaling spend.");
    }

    if (
      norm.growthPotential != null &&
      norm.executionStrength != null &&
      norm.growthPotential >= 0.55 &&
      norm.executionStrength <= 0.32
    ) {
      warnings.push("High expansion score but weak execution blend — inconsistent bundle; treat as tentative.");
    }

    const rationale = [...reasons, `Data tier=${norm.dataTier}; engine confidence=${confidence}.`].join(" ");

    candidates.push({
      bucket: BUCKETS[bid],
      target: norm.city,
      priorityScore,
      effortLevel: effortFromScore(priorityScore),
      confidence,
      rationale,
      supportingSignals: supportingForCity(norm, bid),
      risks: [risksDefault],
      warnings,
    });
  }

  const systemBrokerBucket = classifySystemBrokerBucket({
    insufficientBrokerRows: insufficientBrokers,
    totalBrokerRows: snapshot.brokers.length,
    scaleBrokersDelta: brokersRow?.gapChange,
  });

  if (systemBrokerBucket === "broker_acquisition") {
    const scored = computeAllocationPriority({
      growthPotential: expansionTop?.[0] ? expansionTop[0].score / 100 : undefined,
      executionStrength: undefined,
      scaleGapLeads,
      competitionPressure: brokerRatio,
      dataTier: brokerRatio != null && brokerRatio >= 0.45 ? "low" : "medium",
    });
    candidates.push({
      bucket: BUCKETS.broker_acquisition,
      target: "system:broker_supply",
      priorityScore: scored.priorityScore,
      effortLevel: effortFromScore(scored.priorityScore),
      confidence: mergeConfidence(scored.confidence, brokerRatio != null && brokerRatio >= 0.45 ? "low" : "medium"),
      rationale:
        "Broker monetization proxies are sparse for many tracked brokers or broker pipeline delta deteriorated — prioritize supply-side outreach (manual).",
      supportingSignals: [
        `Insufficient-data broker rows=${insufficientBrokers}/${snapshot.brokers.length || 1}`,
        brokersRow ? `Broker scale gapChange=${brokersRow.gapChange}` : "Broker scale row unavailable.",
      ],
      risks: [risksDefault],
      warnings: [
        ...scored.warnings,
        "Does not evaluate partner quality — review CRM fit before committing relationship time.",
      ],
    });
  }

  /** Stable sort: score desc, then target asc. */
  candidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.target.localeCompare(b.target);
  });

  const dedup = new Map<string, (typeof candidates)[number]>();
  for (const c of candidates) {
    const key = `${c.bucket.id}:${c.target}`;
    const prev = dedup.get(key);
    if (!prev || c.priorityScore > prev.priorityScore) dedup.set(key, c);
  }

  const merged = [...dedup.values()].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.target.localeCompare(b.target);
  });

  const topN = merged.slice(0, 6);
  const sum = topN.reduce((acc, r) => acc + r.priorityScore, 0);
  const withShares: CapitalAllocationRecommendation[] = topN.map((r) => ({
    ...r,
    allocationShare: sum > 0 ? Math.round((r.priorityScore / sum) * 1000) / 1000 : undefined,
  }));

  const topFocusAreas = withShares.slice(0, 3).map((r) => `${r.bucket.label} · ${r.target}`);
  const deprioritizedAreas = merged
    .filter((r) => r.bucket.id === "hold" || r.priorityScore < 48)
    .slice(0, 4)
    .map((r) => `${r.target} (${r.bucket.label})`);

  if (!withShares.length) {
    const fallback: CapitalAllocationRecommendation = {
      bucket: BUCKETS.hold,
      target: "system:growth_signals",
      priorityScore: 40,
      allocationShare: 1,
      effortLevel: "low",
      confidence: "low",
      rationale:
        "No ranked city bundle available — enable Fast Deal city comparison + related growth flags, or wait for more logged events.",
      supportingSignals: ["comparison bundle empty or disabled in this environment."],
      risks: [risksDefault],
      warnings: [
        "Do not infer budget split from this placeholder — collect more primary signals first.",
      ],
    };
    const insights = buildCapitalAllocationInsights({
      recommendations: [fallback],
      topFocusAreas: [],
      deprioritizedAreas: ["All markets (pending data)"],
      generatedAt: new Date().toISOString(),
    });
    const plan: CapitalAllocationPlan = {
      recommendations: [fallback],
      topFocusAreas: [],
      deprioritizedAreas: ["Insufficient bundle — see warnings."],
      insights,
      generatedAt: new Date().toISOString(),
    };
    void recordCapitalAllocationPlan(plan);
    return plan;
  }

  const insights = buildCapitalAllocationInsights({
    recommendations: withShares,
    topFocusAreas,
    deprioritizedAreas,
    generatedAt: new Date().toISOString(),
  });

  const plan: CapitalAllocationPlan = {
    recommendations: withShares,
    topFocusAreas,
    deprioritizedAreas,
    insights,
    generatedAt: new Date().toISOString(),
  };

  void recordCapitalAllocationPlan(plan);
  return plan;
}

export { BUCKETS as CAPITAL_ALLOCATION_BUCKET_DEFS };
