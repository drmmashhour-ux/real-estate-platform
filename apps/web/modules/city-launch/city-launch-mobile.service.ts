import { loadTerritories } from "@/modules/market-domination/market-domination.service";

import { getStepRecord } from "./city-launch-progress.service";
import { buildCityLaunchFullView } from "./city-launch.service";

/** Compact multi-territory snapshot for mobile admin home. */
export function buildCityLaunchMobileSummaryList() {
  const territories = loadTerritories();
  const rows = territories.map((t) => {
    const v = buildCityLaunchFullView(t.id);
    if (!v) return null;
    const openSteps = v.steps
      .filter((s) => {
        const rec = getStepStatusMock(t.id, s.id);
        return rec !== "completed";
      })
      .slice(0, 5)
      .map((s) => ({ id: s.id, title: s.title, phaseId: s.phaseId, priority: s.priority }));

    return {
      territoryId: t.id,
      territoryName: t.name,
      phase: v.currentPhaseId,
      completionPercent: v.progress.completionPercent,
      nextSteps: openSteps,
      urgentActions: v.alerts.filter((a) => a.severity !== "info").slice(0, 5),
    };
  });

  return {
    generatedAtIso: new Date().toISOString(),
    territories: rows.filter(Boolean),
    disclaimer:
      "Browser-stored progress in demos — sync with CRM/API for authoritative execution state.",
  };
}
