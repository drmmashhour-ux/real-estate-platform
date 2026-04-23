import type { GrowthBrainAlert, GrowthOpportunity, NormalizedSignal } from "./growth-brain.types";
import { uid } from "./growth-brain-signals.service";

export function buildGrowthAlerts(
  signals: NormalizedSignal[],
  opportunities: GrowthOpportunity[],
  allocationShift?: boolean
): GrowthBrainAlert[] {
  const alerts: GrowthBrainAlert[] = [];

  for (const s of signals) {
    if (s.severity === "critical") {
      alerts.push({
        id: uid(),
        kind: "revenue_leak",
        title: s.title,
        body: s.summary,
        severity: "critical",
        createdAtIso: new Date().toISOString(),
        relatedSignalIds: [s.signalId],
      });
    }
  }

  const top = opportunities[0];
  if (top && top.priorityScore >= 0.62) {
    alerts.push({
      id: uid(),
      kind: "major_opportunity",
      title: `Top opportunity: ${top.title}`,
      body: top.whyNow,
      severity: "important",
      createdAtIso: new Date().toISOString(),
      relatedSignalIds: top.sourceSignalIds,
    });
  }

  const bnhub = signals.find((x) => x.domain === "BNHUB" && x.severity !== "info");
  if (bnhub) {
    alerts.push({
      id: uid(),
      kind: "hub_attention",
      title: "BNHub attention",
      body: bnhub.summary,
      severity: bnhub.severity === "watch" ? "watch" : "important",
      createdAtIso: new Date().toISOString(),
      relatedSignalIds: [bnhub.signalId],
    });
  }

  if (allocationShift) {
    alerts.push({
      id: uid(),
      kind: "allocation_shift",
      title: "Rebalance recommended",
      body: "Opportunity mix changed materially — review allocation guidance for this week.",
      severity: "watch",
      createdAtIso: new Date().toISOString(),
    });
  }

  const leak = signals.find((s) => s.signalType === "PIPELINE_STAGE_LEAK");
  if (leak) {
    alerts.push({
      id: uid(),
      kind: "revenue_leak",
      title: "Pipeline leak signal",
      body: leak.summary,
      severity: "important",
      createdAtIso: new Date().toISOString(),
      relatedSignalIds: [leak.signalId],
    });
  }

  return alerts.slice(0, 25);
}
