/**
 * Deterministic outcome linkage from observable growth metrics — read-only, no DB writes.
 */

import type { GrowthLearningOutcome, GrowthLearningSignal } from "./growth-learning.types";

export type GrowthLearningMetricSnapshot = {
  observedAt: string;
  leadsTodayEarly: number;
  totalEarlyLeads: number;
  adsHealth: "WEAK" | "OK" | "STRONG";
  dueNowCount: number;
  hotLeadCount: number;
  attributedCampaigns: number;
  crmLeadTotal: number;
};

/**
 * Links synthetic signals to outcomes using threshold heuristics only.
 * When metrics are ambiguous, marks `insufficient_data`.
 */
export function linkGrowthSignalsToOutcomes(
  metrics: GrowthLearningMetricSnapshot,
): { signals: GrowthLearningSignal[]; outcomes: GrowthLearningOutcome[] } {
  const createdAt = metrics.observedAt;
  const signals: GrowthLearningSignal[] = [];
  const outcomes: GrowthLearningOutcome[] = [];

  const pushPair = (
    sig: GrowthLearningSignal,
    outcome: Omit<GrowthLearningOutcome, "signalId" | "observedAt"> & { observedAt?: string },
  ) => {
    signals.push(sig);
    outcomes.push({
      signalId: sig.id,
      observedAt: outcome.observedAt ?? createdAt,
      outcomeType: outcome.outcomeType,
      outcomeValue: outcome.outcomeValue,
      rationale: outcome.rationale,
    });
  };

  // UTM / ads funnel signal
  const sigAds: GrowthLearningSignal = {
    id: "gl-sig-utm-funnel",
    source: "ads",
    title: "UTM early-conversion funnel responsiveness",
    why: "Heuristic from early_conversion_lead volume vs attributed campaigns.",
    impact: metrics.attributedCampaigns > 0 ? "high" : "medium",
    confidence: 0.55,
    priorityScore: 70,
    createdAt,
  };
  let adsOutcome: GrowthLearningOutcome["outcomeType"];
  let adsRationale: string;
  if (metrics.attributedCampaigns === 0 && metrics.totalEarlyLeads < 3) {
    adsOutcome = "insufficient_data";
    adsRationale = "Not enough UTM-attributed history to judge funnel responsiveness.";
  } else if (metrics.leadsTodayEarly >= 1 && (metrics.adsHealth === "OK" || metrics.adsHealth === "STRONG")) {
    adsOutcome = "positive";
    adsRationale = "Early leads present today with non-weak ads band.";
  } else if (metrics.leadsTodayEarly === 0 && metrics.totalEarlyLeads >= 8 && metrics.attributedCampaigns > 0) {
    adsOutcome = "negative";
    adsRationale = "No early leads today despite historical volume and attributed campaigns — investigate capture path.";
  } else {
    adsOutcome = "neutral";
    adsRationale = "Mixed or low-volume funnel signals — no strong verdict.";
  }
  pushPair(sigAds, { outcomeType: adsOutcome, rationale: adsRationale, observedAt: createdAt });

  // Follow-up / leads discipline
  const sigLeads: GrowthLearningSignal = {
    id: "gl-sig-followup-queue",
    source: "leads",
    title: "Internal follow-up queue pressure",
    why: "Heuristic from due-now count vs hot lead volume.",
    impact: metrics.dueNowCount >= 6 ? "high" : metrics.dueNowCount > 0 ? "medium" : "low",
    confidence: 0.5,
    priorityScore: 68,
    createdAt,
  };
  let leadsOutcome: GrowthLearningOutcome["outcomeType"];
  let leadsRationale: string;
  if (metrics.crmLeadTotal < 2) {
    leadsOutcome = "insufficient_data";
    leadsRationale = "CRM lead count too small to evaluate follow-up outcomes.";
  } else if (metrics.dueNowCount === 0) {
    leadsOutcome = "positive";
    leadsRationale = "No overdue follow-up items in sampled queue.";
  } else if (metrics.dueNowCount >= 8) {
    leadsOutcome = "negative";
    leadsRationale = "Elevated due-now backlog — capacity or routing strain.";
  } else {
    leadsOutcome = "neutral";
    leadsRationale = "Some follow-up due items — within normal advisory range.";
  }
  pushPair(sigLeads, { outcomeType: leadsOutcome, rationale: leadsRationale, observedAt: createdAt });

  // Pipeline heat vs acquisition
  const sigFusion: GrowthLearningSignal = {
    id: "gl-sig-pipeline-heat",
    source: "fusion",
    title: "Hot lead inventory vs acquisition intake",
    why: "Compares hot/high-score leads to early-conversion intake today.",
    impact: "medium",
    confidence: 0.48,
    priorityScore: 55,
    createdAt,
  };
  let fusionOutcome: GrowthLearningOutcome["outcomeType"];
  let fusionRationale: string;
  if (metrics.crmLeadTotal < 3) {
    fusionOutcome = "insufficient_data";
    fusionRationale = "Insufficient CRM coverage for heat vs intake comparison.";
  } else if (metrics.hotLeadCount >= 1 && metrics.leadsTodayEarly >= 1) {
    fusionOutcome = "positive";
    fusionRationale = "Hot pipeline and same-day early intake both present — alignment signal.";
  } else if (metrics.hotLeadCount >= 6 && metrics.leadsTodayEarly === 0) {
    fusionOutcome = "negative";
    fusionRationale = "Strong hot inventory but no early-conversion leads today — possible funnel timing gap.";
  } else {
    fusionOutcome = "neutral";
    fusionRationale = "No strong alignment or conflict detected.";
  }
  pushPair(sigFusion, { outcomeType: fusionOutcome, rationale: fusionRationale, observedAt: createdAt });

  const sigStrain: GrowthLearningSignal = {
    id: "gl-sig-operational-strain",
    source: "cro",
    title: "Operational strain (ads band vs follow-up load)",
    why: "Cross-check of funnel health and internal queue pressure.",
    impact: metrics.adsHealth === "WEAK" ? "high" : "medium",
    confidence: 0.52,
    priorityScore: 63,
    createdAt,
  };
  let strainOutcome: GrowthLearningOutcome["outcomeType"];
  let strainRationale: string;
  if (metrics.crmLeadTotal < 5) {
    strainOutcome = "insufficient_data";
    strainRationale = "CRM base too small to score operational strain.";
  } else if (metrics.adsHealth === "WEAK" && metrics.dueNowCount >= 4) {
    strainOutcome = "negative";
    strainRationale = "Weak ads band alongside elevated follow-up pressure.";
  } else if ((metrics.adsHealth === "OK" || metrics.adsHealth === "STRONG") && metrics.dueNowCount <= 1) {
    strainOutcome = "positive";
    strainRationale = "Healthy ads band with low follow-up pressure — stable operating picture.";
  } else {
    strainOutcome = "neutral";
    strainRationale = "Mixed operating signals — no strong strain verdict.";
  }
  pushPair(sigStrain, { outcomeType: strainOutcome, rationale: strainRationale, observedAt: createdAt });

  const sigPortfolio: GrowthLearningSignal = {
    id: "gl-sig-crm-density",
    source: "leads",
    title: "CRM portfolio density for signal confidence",
    why: "Larger portfolios make heuristic outcomes more reliable.",
    impact: "low",
    confidence: 0.42,
    priorityScore: 40,
    createdAt,
  };
  let portOutcome: GrowthLearningOutcome["outcomeType"];
  let portRationale: string;
  if (metrics.crmLeadTotal < 8) {
    portOutcome = "insufficient_data";
    portRationale = "Lead portfolio still small — outcome linkage kept informational only.";
  } else if (metrics.crmLeadTotal >= 40 && metrics.hotLeadCount >= 2) {
    portOutcome = "positive";
    portRationale = "Material CRM volume with active hot tier — good signal density.";
  } else if (metrics.crmLeadTotal >= 40 && metrics.hotLeadCount === 0) {
    portOutcome = "neutral";
    portRationale = "Volume present but no hot-tier rows — verify scoring freshness.";
  } else {
    portOutcome = "neutral";
    portRationale = "Mid-size portfolio — outcomes treated as advisory.";
  }
  pushPair(sigPortfolio, { outcomeType: portOutcome, rationale: portRationale, observedAt: createdAt });

  return { signals, outcomes };
}
