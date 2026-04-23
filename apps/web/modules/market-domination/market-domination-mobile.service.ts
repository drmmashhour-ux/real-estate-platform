import { buildMarketDominationSnapshot } from "./market-domination.service";

/** Aggregated payload for mobile admin clients — coarse signals, no fake precision. */
export function buildMarketDominationMobileSummary() {
  const snap = buildMarketDominationSnapshot();

  const readinessSummary = {
    NOT_READY: 0,
    EMERGING: 0,
    READY: 0,
    PRIORITY: 0,
  } as const;
  type Band = keyof typeof readinessSummary;
  const counts = { ...readinessSummary };
  for (const t of snap.territories) {
    const r = snap.readinessByTerritory[t.id];
    if (r) counts[r.band as Band] += 1;
  }

  const pressureZones = [...snap.territories]
    .map((t) => ({
      territoryId: t.id,
      territoryName: t.name,
      pressureScore: snap.competitorByTerritory[t.id]?.pressureScore ?? 0,
    }))
    .sort((a, b) => b.pressureScore - a.pressureScore)
    .slice(0, 8);

  return {
    generatedAtIso: snap.generatedAtIso,
    topPriorityMarkets: snap.prioritized.slice(0, 5),
    gapAlerts: snap.gaps.filter((g) => g.severity !== "watch").slice(0, 12),
    readinessSummary: counts,
    competitorPressureZones: pressureZones,
    executiveAlerts: snap.alerts.slice(0, 20),
    disclaimer:
      "Heuristic model using normalized proxies and optional manual competitor entries — validate before capital allocation.",
  };
}
