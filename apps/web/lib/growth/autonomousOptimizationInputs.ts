import "server-only";

import { getMarketplaceBrainActions } from "@/lib/ai/marketplaceBrain";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";

import type { AutonomousOptimizationAction } from "./autonomousOptimizationLoop";

const PRIO = { high: 0, medium: 1, low: 2 } as const;

function sortByPriority(actions: AutonomousOptimizationAction[]): AutonomousOptimizationAction[] {
  return [...actions].sort((a, b) => PRIO[a.priority] - PRIO[b.priority]);
}

/**
 * Marketplace brain actions (pricing, growth, trust, campaigns, conversion) — read-only upstream.
 */
export async function loadBrainOptimizationActions(): Promise<AutonomousOptimizationAction[]> {
  const raw = await getMarketplaceBrainActions();
  return sortByPriority(
    raw.map((a) => ({
      id: a.id,
      area: a.area,
      priority: a.priority,
      safeToAutomate: a.safeToAutomate,
      title: a.title,
      detail: `${a.description}\n${a.recommendedAction}`,
    })),
  );
}

/**
 * Lightweight search/demand hints from the heatmap — does not mutate rankings or ads.
 */
export async function loadSearchDemandActions(): Promise<AutonomousOptimizationAction[]> {
  const heat = await getDemandHeatmap();
  if (heat.length === 0) return [];
  const sorted = [...heat].sort((a, b) => b.demandScore - a.demandScore);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const actions: AutonomousOptimizationAction[] = [];
  if (top && top.city) {
    actions.push({
      id: `search-demand-hot-${top.city}`,
      area: "growth",
      priority: top.trend > 0 ? "high" : "medium",
      safeToAutomate: false,
      title: `Demand attention: ${top.city}`,
      detail: `Top demand score ${top.demandScore.toFixed(2)}; trend ${(top.trend * 100).toFixed(0)}% vs prior week.`,
    });
  }
  if (bottom && bottom.city && bottom.city !== top?.city) {
    actions.push({
      id: `search-demand-weak-${bottom.city}`,
      area: "growth",
      priority: "low",
      safeToAutomate: false,
      title: `Review weak demand: ${bottom.city}`,
      detail: `Lowest demand score in sample: ${bottom.demandScore.toFixed(2)}.`,
    });
  }
  return sortByPriority(actions);
}
