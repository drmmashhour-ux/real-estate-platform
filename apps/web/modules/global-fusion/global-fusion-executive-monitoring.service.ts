/**
 * Phase G executive observability — [global:fusion:executive]
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { GlobalFusionExecutiveSummary, GlobalFusionExecutiveThemeId } from "./global-fusion.types";

const NS = "[global:fusion:executive]";

type ExMon = {
  summariesGenerated: number;
  feedEmissions: number;
  summaryFailures: number;
  missingSourceHits: number;
  highPriorityCountAccum: number;
  highRiskCountAccum: number;
  themeDistribution: Partial<Record<GlobalFusionExecutiveThemeId, number>>;
  blockerDistribution: Record<string, number>;
  lastSummaryAt: string | null;
  lastWeakEvidence: boolean;
};

let em: ExMon = {
  summariesGenerated: 0,
  feedEmissions: 0,
  summaryFailures: 0,
  missingSourceHits: 0,
  highPriorityCountAccum: 0,
  highRiskCountAccum: 0,
  themeDistribution: {},
  blockerDistribution: {},
  lastSummaryAt: null,
  lastWeakEvidence: false,
};

export function recordExecutiveSummaryGenerated(summary: GlobalFusionExecutiveSummary): void {
  try {
    em.summariesGenerated++;
    em.lastSummaryAt = summary.provenance.generatedAt;
    const highPri = summary.topPriorities.filter((p) => p.importance === "high").length;
    const highRisk = summary.topRisks.filter((r) => r.severity === "high").length;
    em.highPriorityCountAccum += highPri;
    em.highRiskCountAccum += highRisk;
    if (summary.healthSummary.missingSourceCount > 2 || summary.rolloutSummary.missingSourceRate > 0.35) {
      em.missingSourceHits++;
    }
    for (const t of summary.themes) {
      em.themeDistribution[t.id] = (em.themeDistribution[t.id] ?? 0) + 1;
    }
    for (const b of summary.topBlockers) {
      const k = b.dependencies[0] ?? "unknown";
      em.blockerDistribution[k] = (em.blockerDistribution[k] ?? 0) + 1;
    }
    const weak =
      summary.notes.includes("weak_monitoring_runs_executive_caution") ||
      summary.notes.includes("missing_source_degradation");
    em.lastWeakEvidence = weak;
    if (weak) {
      logWarn(NS, { event: "observation", kind: "weak_evidence_executive" });
    }
    if (summary.topPriorities.length > 8) {
      logWarn(NS, { event: "observation", kind: "many_priority_items" });
    }
    if (summary.topBlockers.length >= 6) {
      logWarn(NS, { event: "observation", kind: "blocker_concentration" });
    }
    logInfo(NS, {
      event: "summary_generated",
      overallStatus: summary.overallStatus,
      priorities: summary.topPriorities.length,
      risks: summary.topRisks.length,
      blockers: summary.topBlockers.length,
      systems: summary.provenance.contributingSystemsCount,
      missingSources: summary.healthSummary.missingSourceCount,
    });
  } catch {
    /* noop */
  }
}

export function recordExecutiveSummaryFailure(): void {
  try {
    em.summaryFailures++;
    logWarn(NS, { event: "summary_failure" });
  } catch {
    /* noop */
  }
}

export function recordExecutiveFeedEmitted(): void {
  try {
    em.feedEmissions++;
    logInfo(NS, { event: "feed_emitted", count: em.feedEmissions });
  } catch {
    /* noop */
  }
}

export function getExecutiveMonitoringSummary(): {
  summariesGenerated: number;
  feedEmissions: number;
  summaryFailures: number;
  missingSourceHits: number;
  highPriorityCountAccum: number;
  highRiskCountAccum: number;
  themeDistribution: Partial<Record<GlobalFusionExecutiveThemeId, number>>;
  blockerDistribution: Record<string, number>;
  lastSummaryAt: string | null;
  lastWeakEvidence: boolean;
} {
  return {
    summariesGenerated: em.summariesGenerated,
    feedEmissions: em.feedEmissions,
    summaryFailures: em.summaryFailures,
    missingSourceHits: em.missingSourceHits,
    highPriorityCountAccum: em.highPriorityCountAccum,
    highRiskCountAccum: em.highRiskCountAccum,
    themeDistribution: { ...em.themeDistribution },
    blockerDistribution: { ...em.blockerDistribution },
    lastSummaryAt: em.lastSummaryAt,
    lastWeakEvidence: em.lastWeakEvidence,
  };
}

export function resetGlobalFusionExecutiveMonitoringForTests(): void {
  em = {
    summariesGenerated: 0,
    feedEmissions: 0,
    summaryFailures: 0,
    missingSourceHits: 0,
    highPriorityCountAccum: 0,
    highRiskCountAccum: 0,
    themeDistribution: {},
    blockerDistribution: {},
    lastSummaryAt: null,
    lastWeakEvidence: false,
  };
}
