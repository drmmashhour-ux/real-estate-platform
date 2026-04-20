import type {
  GrowthDashboardSummary,
  GrowthFunnelSummary,
  GrowthGrowthTrendWindow,
  GrowthOpportunity,
  GrowthRegionOpportunitySummary,
  GrowthSignal,
  GrowthTrustLeverageSummary,
  GrowthTrendSummary,
} from "./growth.types";
import { scoreGrowthOpportunity } from "./growth-priority.service";

export function buildGrowthDashboardSummary(params: {
  snapshotId: string;
  collectedAt: string;
  signals: GrowthSignal[];
  opportunities: GrowthOpportunity[];
  availabilityNotes: string[];
}): GrowthDashboardSummary {
  const signalCounts: GrowthDashboardSummary["signalCountsByType"] = {};
  for (const s of params.signals) {
    signalCounts[s.signalType] = (signalCounts[s.signalType] ?? 0) + 1;
  }
  const oppCounts: GrowthDashboardSummary["opportunityCountsByType"] = {};
  for (const o of params.opportunities) {
    oppCounts[o.opportunityType] = (oppCounts[o.opportunityType] ?? 0) + 1;
  }
  const sorted = [...params.opportunities].sort(
    (a, b) => scoreGrowthOpportunity(b).totalScore - scoreGrowthOpportunity(a).totalScore
  );
  return {
    snapshotId: params.snapshotId,
    collectedAt: params.collectedAt,
    signalCountsByType: signalCounts,
    opportunityCountsByType: oppCounts,
    topOpportunityIds: sorted.slice(0, 12).map((o) => o.id),
    availabilityNotes: params.availabilityNotes,
  };
}

export function buildGrowthRegionOpportunitySummary(opportunities: GrowthOpportunity[]): GrowthRegionOpportunitySummary[] {
  const map = new Map<string, { count: number; sev: "critical" | "warning" | "info" }>();
  const rank = { critical: 3, warning: 2, info: 1 };
  const pickHigher = (
    a: "critical" | "warning" | "info",
    b: "critical" | "warning" | "info"
  ): "critical" | "warning" | "info" => {
    return rank[a] >= rank[b] ? a : b;
  };
  for (const o of opportunities) {
    const key = o.region ?? "global";
    const cur = map.get(key) ?? { count: 0, sev: "info" as const };
    cur.count += 1;
    cur.sev = pickHigher(cur.sev, o.severity);
    map.set(key, cur);
  }
  return [...map.entries()].map(([regionKey, v]) => ({
    regionKey,
    opportunityCount: v.count,
    highestSeverity: v.sev,
    summary: `${v.count} opportunities flagged for region ${regionKey}`,
  }));
}

export function buildGrowthFunnelSummary(signals: GrowthSignal[]): GrowthFunnelSummary {
  const drops = signals.filter((s) => s.signalType === "lead_form_dropoff" || s.signalType === "low_conversion_page");
  const worst = drops.map((s) => ({
    listingId: (s.metadata.listingId as string) ?? s.entityId ?? "",
    ratio: typeof s.metadata.ratio === "number" ? s.metadata.ratio : 0,
    views: typeof s.metadata.views === "number" ? s.metadata.views : 0,
    contacts: typeof s.metadata.contactClicks === "number" ? s.metadata.contactClicks : 0,
  }));
  return {
    worstListings: worst
      .filter((w) => w.listingId)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 8),
    notes: drops.length ? ["Derived from analytics funnel ratios — advisory only."] : ["No funnel anomalies in this snapshot window."],
  };
}

export function buildGrowthTrustLeverageSummary(signals: GrowthSignal[]): GrowthTrustLeverageSummary {
  const n = signals.filter((s) => s.signalType === "trust_conversion_opportunity").length;
  return {
    highTrustLowExposureCount: n,
    notes:
      n > 0
        ? ["Trust-forward listings with weaker exposure — recommend completion prompts (not public scores)."]
        : ["No trust leverage opportunities in this pass."],
  };
}

function isTimelineDerivedSignalType(t: string): boolean {
  return t === "trend_reversal" || t === "stalled_funnel" || t === "repeat_dropoff_pattern";
}

/** Timeline-window labels are factual (rolling 30d vs prior 30d where EventRecord aggregates exist). */
export function buildGrowthTrendSummary(signals: GrowthSignal[]): GrowthTrendSummary {
  const timelineCompared: GrowthTrendWindow[] = ["30d"];
  const trendSignals = signals.filter((s) => isTimelineDerivedSignalType(s.signalType));

  return {
    trendSignalCount: trendSignals.length,
    stalledFunnelHints: signals.filter((s) => s.signalType === "stalled_funnel").length,
    repeatDropoffHints: signals.filter((s) => s.signalType === "repeat_dropoff_pattern").length,
    timelineWindowsCompared: timelineCompared,
    notes:
      trendSignals.length > 0
        ? [
            "Event timeline aggregates compared trailing 30d vs prior 30d where append-only EventRecord rows exist.",
          ]
        : ["No timeline-derived anomalies in this pass."],
  };
}
