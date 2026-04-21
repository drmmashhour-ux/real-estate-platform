import type { ObjectiveMode, OptimizationEngineResult } from "./portfolio.types";
import type { PortfolioAssetContext } from "./portfolio-access";
import type { PortfolioHealthResult } from "./portfolio.types";
import { allocatePortfolioCapitalBands } from "./portfolio-capital-allocator";
import { buildPortfolioPriorities, pickWatchlistFromHealth } from "./portfolio-prioritizer";
import type { PortfolioPolicy } from "@prisma/client";

export function runPortfolioOptimization(input: {
  objectiveMode: ObjectiveMode;
  contexts: Map<string, PortfolioAssetContext>;
  healthByAsset: Map<string, PortfolioHealthResult>;
  policy: PortfolioPolicy;
}): OptimizationEngineResult {
  const { objectiveMode, contexts, healthByAsset, policy } = input;

  const priorities = buildPortfolioPriorities(contexts, healthByAsset, policy);

  /** Re-rank lightly by objective lens (deterministic tie-break). */
  const adjusted = [...priorities];
  adjusted.sort((a, b) => {
    let boostA = 0;
    let boostB = 0;
    if (objectiveMode === "COMPLIANCE_CLEANUP") {
      if (a.priorityType === "COMPLIANCE") boostA += 2;
      if (b.priorityType === "COMPLIANCE") boostB += 2;
    }
    if (objectiveMode === "ESG_ADVANCEMENT") {
      if (a.priorityType === "ESG") boostA += 2;
      if (b.priorityType === "ESG") boostB += 2;
    }
    if (objectiveMode === "RISK_REDUCTION") {
      if (a.priorityType === "URGENT_FIX") boostA += 2;
      if (b.priorityType === "URGENT_FIX") boostB += 2;
    }
    if (objectiveMode === "CAPITAL_EFFICIENCY") {
      if (a.priorityType === "QUICK_WIN") boostA += 1.5;
      if (b.priorityType === "QUICK_WIN") boostB += 1.5;
    }
    return b.priorityScore + boostB - (a.priorityScore + boostA);
  });

  const topPriorityAssets = adjusted.slice(0, 5).map((p) => ({
    assetId: p.assetId,
    reason: p.explanation.slice(0, 400),
  }));

  const recommendedCapitalAllocation = allocatePortfolioCapitalBands({
    contexts,
    healthByAsset,
    priorities: adjusted,
    policy,
  });

  const watchlist = pickWatchlistFromHealth(healthByAsset).map((w) => ({
    assetId: w.assetId,
    reason: w.reason,
  }));

  const commonActionThemes = deriveCommonThemes(contexts);

  const executiveSummary = [
    `Objective ${objectiveMode}: surfaces top ${topPriorityAssets.length} assets and notional capital bands.`,
    `${watchlist.length} asset(s) on structural watchlist by health band.`,
    commonActionThemes.length
      ? `Cross-cutting themes: ${commonActionThemes.join("; ")}.`
      : "No recurring cross-portfolio themes detected from current signals.",
  ].join(" ");

  return {
    objectiveMode,
    topPriorityAssets,
    recommendedCapitalAllocation,
    commonActionThemes,
    watchlistAssets: watchlist.slice(0, 12),
    executiveSummary,
  };
}

function deriveCommonThemes(contexts: Map<string, PortfolioAssetContext>): string[] {
  let unfinishedOps = 0;
  let weakRev = 0;
  let esgBacklog = 0;
  let financing = 0;

  for (const c of contexts.values()) {
    if (!c.operationsInitialized) unfinishedOps++;
    if (!c.revenueInitialized) weakRev++;
    if (c.esgOpenCriticalOrHigh > 0) esgBacklog++;
    if (c.financingOpenConditions > 0) financing++;
  }

  const themes: string[] = [];
  const n = contexts.size || 1;
  if (unfinishedOps / n >= 0.35) themes.push("operations onboarding incomplete across multiple assets");
  if (weakRev / n >= 0.35) themes.push("revenue signal initialization backlog");
  if (esgBacklog >= 2) themes.push("ESG action-center backlog concentrated in portfolio");
  if (financing >= 2) themes.push("multiple assets carry open financing conditions");

  return themes;
}
