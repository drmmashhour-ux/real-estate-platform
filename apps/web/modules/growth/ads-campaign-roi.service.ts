/**
 * Campaign ROI summary — reuses early-conversion UTM snapshot; advisory scale/pause suggestions only.
 */

import {
  computePaidFunnelAdsInsights,
  fetchEarlyConversionAdsSnapshot,
  type EarlyConversionAdsSnapshot,
} from "./growth-ai-analyzer.service";

export type CampaignRoiSummary = {
  snapshot: EarlyConversionAdsSnapshot;
  problems: string[];
  opportunities: string[];
  health: "STRONG" | "OK" | "WEAK";
  scaleSuggestion: string | null;
  pauseSuggestion: string | null;
};

export async function getCampaignRoiSummary(): Promise<CampaignRoiSummary> {
  const snapshot = await fetchEarlyConversionAdsSnapshot();
  const { problems, opportunities, health } = computePaidFunnelAdsInsights(snapshot);

  let scaleSuggestion: string | null = null;
  let pauseSuggestion: string | null = null;

  if (opportunities.length > 0) {
    scaleSuggestion = opportunities[0] ?? null;
  }
  if (problems.length > 0) {
    pauseSuggestion = `Review or pause spend on weakest UTM before scaling — ${problems[0]}`;
  }

  return {
    snapshot,
    problems,
    opportunities,
    health,
    scaleSuggestion,
    pauseSuggestion,
  };
}
