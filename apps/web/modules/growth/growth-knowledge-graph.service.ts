/**
 * Growth Knowledge Graph — read-only assembly; no persistence; no execution.
 */

import {
  growthGovernanceFlags,
  growthKnowledgeGraphFlags,
  growthMemoryFlags,
  growthSimulationFlags,
  growthStrategyFlags,
} from "@/config/feature-flags";
import { listAutopilotActionsWithStatus } from "./ai-autopilot-api.helpers";
import { computePaidFunnelAdsInsights, fetchEarlyConversionAdsSnapshot } from "./growth-ai-analyzer.service";
import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { buildGrowthKnowledgeEdges } from "./growth-knowledge-graph-edges.service";
import { buildGrowthKnowledgeNodes } from "./growth-knowledge-graph-nodes.service";
import {
  findConflictingDecisionPairs,
  findRecurringBlockerCluster,
  findWinningPatternCluster,
} from "./growth-knowledge-graph-query.service";
import type {
  GrowthKnowledgeGraph,
  GrowthKnowledgeGraphBuildInput,
} from "./growth-knowledge-graph.types";
import {
  logGrowthKnowledgeGraphBuildStarted,
  recordGrowthKnowledgeGraphBuild,
} from "./growth-knowledge-graph-monitoring.service";
import { buildGrowthMemorySummary } from "./growth-memory.service";
import { buildGrowthSimulationBundle } from "./growth-simulation.service";
import { buildGrowthStrategyBundle } from "./growth-strategy.service";

function buildSummary(
  nodes: GrowthKnowledgeGraph["nodes"],
  _edges: GrowthKnowledgeGraph["edges"],
  memory: GrowthKnowledgeGraphBuildInput["memory"],
): GrowthKnowledgeGraph["summary"] {
  const tagCount = new Map<string, number>();
  for (const n of nodes) {
    for (const t of n.tags ?? []) {
      if (t.length > 1) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  const dominantThemes = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 8);

  const recurringBlockers = memory
    ? memory.recurringBlockers.map((e) => e.title).slice(0, 5)
    : nodes.filter((n) => n.type === "blocker").map((n) => n.title).slice(0, 5);

  const repeatedWinners = memory
    ? memory.winningPatterns.map((e) => e.title).slice(0, 5)
    : nodes.filter((n) => n.type === "winning_pattern").map((n) => n.title).slice(0, 5);

  return {
    nodeCount: nodes.length,
    edgeCount: _edges.length,
    dominantThemes,
    recurringBlockers,
    repeatedWinners,
  };
}

export function assembleGrowthKnowledgeGraph(input: GrowthKnowledgeGraphBuildInput): GrowthKnowledgeGraph {
  const nodes = buildGrowthKnowledgeNodes(input);
  const edges = buildGrowthKnowledgeEdges(nodes, input);
  const summary = buildSummary(nodes, edges, input.memory);
  return {
    nodes,
    edges,
    summary,
    createdAt: new Date().toISOString(),
  };
}

export async function buildGrowthKnowledgeGraph(): Promise<GrowthKnowledgeGraph | null> {
  if (!growthKnowledgeGraphFlags.growthKnowledgeGraphV1) {
    return null;
  }

  logGrowthKnowledgeGraphBuildStarted();
  const missingDataWarnings: string[] = [];

  let memory: GrowthKnowledgeGraphBuildInput["memory"] = null;
  if (growthMemoryFlags.growthMemoryV1) {
    try {
      memory = await buildGrowthMemorySummary();
    } catch {
      missingDataWarnings.push("memory_unavailable");
    }
  }

  let executive: GrowthKnowledgeGraphBuildInput["executive"] = null;
  try {
    executive = await buildGrowthExecutiveSummary();
  } catch {
    missingDataWarnings.push("executive_unavailable");
  }

  let governance: GrowthKnowledgeGraphBuildInput["governance"] = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let strategyBundle: GrowthKnowledgeGraphBuildInput["strategyBundle"] = null;
  if (growthStrategyFlags.growthStrategyV1) {
    try {
      strategyBundle = await buildGrowthStrategyBundle();
    } catch {
      missingDataWarnings.push("strategy_unavailable");
    }
  }

  let simulationBundle: GrowthKnowledgeGraphBuildInput["simulationBundle"] = null;
  if (growthSimulationFlags.growthSimulationV1) {
    try {
      simulationBundle = await buildGrowthSimulationBundle();
    } catch {
      missingDataWarnings.push("simulation_unavailable");
    }
  }

  let early: Awaited<ReturnType<typeof fetchEarlyConversionAdsSnapshot>> = null;
  try {
    early = await fetchEarlyConversionAdsSnapshot();
  } catch {
    missingDataWarnings.push("early_conversion_unavailable");
  }

  const insights = early ? computePaidFunnelAdsInsights(early) : null;
  const adsBand = insights?.health ?? executive?.campaignSummary.adsPerformance ?? "OK";
  const topCampaignLabel = early?.topCampaign?.label ?? executive?.campaignSummary.topCampaign;

  const autopilotActionTitles: string[] = [];
  try {
    const payload = await listAutopilotActionsWithStatus();
    for (const a of payload.actions.slice(0, 8)) {
      if (a.title?.trim()) autopilotActionTitles.push(a.title.trim());
    }
  } catch {
    missingDataWarnings.push("autopilot_unavailable");
  }

  const input: GrowthKnowledgeGraphBuildInput = {
    memory,
    executive,
    governance,
    strategyBundle,
    simulationBundle,
    autopilotActionTitles,
    topCampaignLabel,
    adsBand,
    missingDataWarnings,
  };

  const graph = assembleGrowthKnowledgeGraph(input);

  const blockCluster = findRecurringBlockerCluster(graph);
  const winCluster = findWinningPatternCluster(graph);
  const conflicts = findConflictingDecisionPairs(graph);

  recordGrowthKnowledgeGraphBuild({
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    blockerClusterSize: blockCluster.length,
    winnerClusterSize: winCluster.length,
    conflictPairs: conflicts.length,
    topThemes: graph.summary.dominantThemes,
    missingDataWarningCount: missingDataWarnings.length,
  });

  return graph;
}
