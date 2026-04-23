import { buildExpansionRecommendationSet } from "@/modules/self-expansion/self-expansion.engine";

/** Lightweight hints for Autonomy / CEO / Domination surfaces — no DB write. */
export async function buildSelfExpansionDashboardHints(): Promise<{
  nextBestTerritoryId: string | null;
  nextBestTerritoryName: string | null;
  topBlocker: string | null;
  bestEntryHub: string | null;
  expansionUrgency: "low" | "medium" | "high" | "critical";
  generatedAt: string;
}> {
  try {
    const { context, recommendations } = await buildExpansionRecommendationSet();
    const top = recommendations[0];
    if (!top) {
      return {
        nextBestTerritoryId: null,
        nextBestTerritoryName: null,
        topBlocker: null,
        bestEntryHub: null,
        expansionUrgency: "low",
        generatedAt: context.generatedAt,
      };
    }
    const territory = context.territories.find((t) => t.territoryId === top.territoryId);
    const blocker = top.scoreBreakdown.blockers[0] ?? null;
    return {
      nextBestTerritoryId: top.territoryId,
      nextBestTerritoryName: territory?.city ?? top.territoryId,
      topBlocker: blocker,
      bestEntryHub: top.entryHub,
      expansionUrgency: top.urgency,
      generatedAt: context.generatedAt,
    };
  } catch {
    return {
      nextBestTerritoryId: null,
      nextBestTerritoryName: null,
      topBlocker: null,
      bestEntryHub: null,
      expansionUrgency: "low",
      generatedAt: new Date().toISOString(),
    };
  }
}
