/**
 * Growth Memory summary — on-demand consolidation; no persistence in v1.
 */

import {
  growthGovernanceFlags,
  growthMemoryFlags,
  growthSimulationFlags,
  growthStrategyFlags,
} from "@/config/feature-flags";
import { listAutopilotActionsWithStatus } from "./ai-autopilot-api.helpers";
import { coordinateGrowthAgents } from "./growth-agent-coordinator.service";
import { computePaidFunnelAdsInsights, fetchEarlyConversionAdsSnapshot } from "./growth-ai-analyzer.service";
import { loadResponseDeskCadenceHints } from "./growth-cadence-response-desk.loader";
import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { extractGrowthMemoryEntries } from "./growth-memory-extractor.service";
import {
  logGrowthMemoryBuildStarted,
  recordGrowthMemoryBuild,
} from "./growth-memory-monitoring.service";
import type { GrowthStrategyBundle } from "./growth-strategy.types";
import type {
  GrowthMemoryEntry,
  GrowthMemoryExtractorContext,
  GrowthMemorySummary,
} from "./growth-memory.types";
import { buildGrowthSimulationBundle } from "./growth-simulation.service";
import { buildGrowthStrategyBundle } from "./growth-strategy.service";

const CAP_BLOCK = 5;
const CAP_WIN = 5;
const CAP_CAMP = 5;
const CAP_GOV = 4;
const CAP_FU = 5;
const CAP_PREF = 3;

function normTitle(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 96);
}

/**
 * Merges duplicate titles per category; increases recurrence and confidence slightly.
 */
export function consolidateGrowthMemoryEntries(entries: GrowthMemoryEntry[]): GrowthMemoryEntry[] {
  const map = new Map<string, GrowthMemoryEntry>();
  const now = new Date().toISOString();

  for (const e of entries) {
    const key = `${e.category}::${normTitle(e.title)}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...e, lastSeenAt: now });
      continue;
    }
    const n = (prev.recurrenceCount ?? 1) + (e.recurrenceCount ?? 1);
    const conf = Math.min(0.95, Math.max(prev.confidence, e.confidence) + 0.06 * Math.min(3, n - 1));
    map.set(key, {
      ...prev,
      detail: prev.detail.length >= e.detail.length ? prev.detail : e.detail,
      recurrenceCount: n,
      confidence: conf,
      lastSeenAt: now,
      tags: Array.from(new Set([...(prev.tags ?? []), ...(e.tags ?? [])])),
    });
  }

  return [...map.values()].sort((a, b) => (b.confidence - a.confidence) || (b.recurrenceCount ?? 1) - (a.recurrenceCount ?? 1));
}

export function buildGrowthMemorySummaryFromEntries(entries: GrowthMemoryEntry[]): GrowthMemorySummary {
  const merged = consolidateGrowthMemoryEntries(entries);
  const blockers = merged.filter((e) => e.category === "blocker").slice(0, CAP_BLOCK);
  const wins = merged.filter((e) => e.category === "winning_pattern").slice(0, CAP_WIN);
  const camp = merged
    .filter((e) => e.category === "campaign_lesson" || e.category === "governance_lesson")
    .slice(0, CAP_CAMP);
  const fu = merged.filter((e) => e.category === "followup_lesson").slice(0, CAP_FU);
  const pref = merged.filter((e) => e.category === "operator_preference").slice(0, CAP_PREF);

  const summary: GrowthMemorySummary = {
    recurringBlockers: blockers,
    winningPatterns: wins,
    campaignLessons: camp,
    followupLessons: fu,
    operatorPreferences: pref,
    notes: ["Growth memory is advisory — bounded, reversible estimates from current signals."],
    createdAt: new Date().toISOString(),
  };
  return summary;
}

export type BuildGrowthMemorySummaryOptions = {
  /** When set (including null), skips loading strategy — avoids recursion from strategy compose. */
  preloadedStrategyBundle?: GrowthStrategyBundle | null;
};

export async function buildGrowthMemorySummary(
  opts?: BuildGrowthMemorySummaryOptions,
): Promise<GrowthMemorySummary | null> {
  if (!growthMemoryFlags.growthMemoryV1) {
    return null;
  }

  logGrowthMemoryBuildStarted();
  const missingDataWarnings: string[] = [];

  let executive: GrowthMemoryExtractorContext["executive"] = null;
  try {
    executive = await buildGrowthExecutiveSummary();
  } catch {
    missingDataWarnings.push("executive_unavailable");
  }

  let governance: GrowthMemoryExtractorContext["governance"] = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let strategyBundle: GrowthMemoryExtractorContext["strategyBundle"] = null;
  if (opts?.preloadedStrategyBundle !== undefined) {
    strategyBundle = opts.preloadedStrategyBundle;
  } else if (growthStrategyFlags.growthStrategyV1) {
    try {
      strategyBundle = await buildGrowthStrategyBundle();
    } catch {
      missingDataWarnings.push("strategy_unavailable");
    }
  }

  let coordination: GrowthMemoryExtractorContext["coordination"] = null;
  try {
    coordination = await coordinateGrowthAgents();
  } catch {
    missingDataWarnings.push("coordination_unavailable");
  }

  let simulationBundle: GrowthMemoryExtractorContext["simulationBundle"] = null;
  if (growthSimulationFlags.growthSimulationV1) {
    try {
      simulationBundle = await buildGrowthSimulationBundle();
    } catch {
      missingDataWarnings.push("simulation_unavailable");
    }
  }

  let responseDesk: GrowthMemoryExtractorContext["responseDesk"] = null;
  try {
    responseDesk = await loadResponseDeskCadenceHints();
  } catch {
    missingDataWarnings.push("response_desk_unavailable");
  }

  let early = null as Awaited<ReturnType<typeof fetchEarlyConversionAdsSnapshot>>;
  try {
    early = await fetchEarlyConversionAdsSnapshot();
  } catch {
    missingDataWarnings.push("early_conversion_unavailable");
  }

  const insights = early ? computePaidFunnelAdsInsights(early) : null;
  const adsHealth = insights?.health ?? executive?.campaignSummary.adsPerformance ?? "OK";
  const topUtm = early?.topCampaign?.label ?? executive?.campaignSummary.topCampaign;
  const leadsToday = early?.leadsToday ?? 0;

  let autopilotRejected = 0;
  let autopilotPending = 0;
  let autopilotManualOnly = 0;
  try {
    const payload = await listAutopilotActionsWithStatus();
    for (const a of payload.actions) {
      if (a.status === "rejected") autopilotRejected += 1;
      if (a.status === "pending") autopilotPending += 1;
      if (a.executionMode === "manual_only") autopilotManualOnly += 1;
    }
  } catch {
    missingDataWarnings.push("autopilot_payload_unavailable");
  }

  const ctx: GrowthMemoryExtractorContext = {
    executive,
    governance,
    strategyBundle,
    coordination,
    simulationBundle,
    responseDesk,
    adsHealth,
    topUtmCampaign: topUtm,
    leadsToday,
    autopilotRejected,
    autopilotPending,
    autopilotManualOnly,
    missingDataWarnings,
    missionControlDigest: opts?.preloadedMissionDigest,
  };

  const raw = extractGrowthMemoryEntries(ctx);
  const summary = buildGrowthMemorySummaryFromEntries(raw);
  summary.notes.unshift(
    ...(missingDataWarnings.length
      ? [`Partial inputs: ${missingDataWarnings.slice(0, 5).join("; ")}`]
      : []),
  );

  recordGrowthMemoryBuild({
    entriesExtracted: raw.length,
    recurringBlockers: summary.recurringBlockers.length,
    winningPatterns: summary.winningPatterns.length,
    lessonsCount:
      summary.campaignLessons.length + summary.followupLessons.length + summary.governanceLessons.length,
    missingDataWarningCount: missingDataWarnings.length,
  });

  return summary;
}
