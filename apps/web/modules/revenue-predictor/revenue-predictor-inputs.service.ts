import { getSalesProfile } from "@/modules/ai-sales-manager/ai-sales-profile.service";
import { listTeamMembers, getTeam } from "@/modules/team-training/team.service";

import {
  CONFIDENCE_THRESHOLDS,
  CONTEXT_BOUNDS,
} from "./revenue-predictor.config";
import type {
  PipelinePredictorFilters,
  PipelineStage,
  RevenueFinancialSnapshot,
  SalespersonPredictorInput,
  TeamPredictorInput,
} from "./revenue-predictor.types";
import { loadRevenuePredictorStore, saveRevenuePredictorStore } from "./revenue-predictor-storage";

const STAGES_OPEN: PipelineStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "DEMO_SCHEDULED",
  "QUALIFIED",
  "OFFER",
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function defaultSnapshot(userId: string): RevenueFinancialSnapshot {
  return {
    userId,
    averageDealValueCents: 0,
    pipelineValueCents: 0,
    openDeals: 0,
    conversionByStage: {},
    updatedAtIso: new Date().toISOString(),
  };
}

export function getRevenueFinancialSnapshot(userId: string): RevenueFinancialSnapshot {
  const store = loadRevenuePredictorStore();
  return store.snapshots[userId] ?? defaultSnapshot(userId);
}

export function saveRevenueFinancialSnapshot(patch: Partial<RevenueFinancialSnapshot> & { userId: string }): RevenueFinancialSnapshot {
  const store = loadRevenuePredictorStore();
  const prev = store.snapshots[patch.userId] ?? defaultSnapshot(patch.userId);
  const next: RevenueFinancialSnapshot = {
    ...prev,
    ...patch,
    updatedAtIso: new Date().toISOString(),
  };
  if (next.seasonalityFactor !== undefined) {
    next.seasonalityFactor = clamp(next.seasonalityFactor, CONTEXT_BOUNDS.seasonality.min, CONTEXT_BOUNDS.seasonality.max);
  }
  if (next.currentDemandSignal !== undefined) {
    next.currentDemandSignal = clamp(next.currentDemandSignal, CONTEXT_BOUNDS.demand.min, CONTEXT_BOUNDS.demand.max);
  }
  store.snapshots[patch.userId] = next;
  saveRevenuePredictorStore(store);
  return next;
}

function objectionSuccessFromProfile(
  trainingScore: number,
  totalCalls: number,
  commonObjectionCount: number,
): number {
  let base = 0.48 + (trainingScore / 100) * 0.35;
  if (totalCalls >= 6) base += 0.04;
  base -= Math.min(0.18, commonObjectionCount * 0.025);
  return clamp(base, 0.18, 0.92);
}

/**
 * Aggregates AI Sales Manager profile + revenue snapshot + heuristics for CRM gaps.
 */
export function buildSalespersonPredictorInput(userId: string): SalespersonPredictorInput {
  const p = getSalesProfile(userId);
  const fin = getRevenueFinancialSnapshot(userId);

  let pipelineValueCents = fin.pipelineValueCents;
  const openDeals = fin.openDeals;
  const avgDeal = fin.averageDealValueCents;

  if (pipelineValueCents <= 0 && avgDeal > 0 && openDeals > 0) {
    pipelineValueCents = Math.round(avgDeal * openDeals * 0.42);
  }

  const averageCallScore = (p.averageTrainingScore + p.averageControlScore + p.averageClosingScore) / 3;

  return {
    userId,
    displayName: p.displayName,
    totalCalls: p.totalCalls,
    demosBooked: p.demosBooked,
    closesWon: p.closesWon,
    closesLost: p.closesLost,
    averageCallScore: Number.isFinite(averageCallScore) ? averageCallScore : 60,
    averageControlScore: p.averageControlScore,
    averageClosingScore: p.averageClosingScore,
    trainingScore: p.averageTrainingScore,
    objectionSuccessRate: objectionSuccessFromProfile(
      p.averageTrainingScore,
      p.totalCalls,
      p.mostCommonObjections.length,
    ),
    improvementTrend: p.improvementTrend,
    averageDealValueCents: avgDeal,
    pipelineValueCents,
    currentOpenDeals: openDeals,
    conversionByStage: { ...fin.conversionByStage },
    hubType: fin.hubType,
    region: fin.region,
    dealType: fin.dealType,
    seasonalityFactor: fin.seasonalityFactor,
    currentDemandSignal: fin.currentDemandSignal,
  };
}

export function buildTeamPredictorInput(teamId: string): TeamPredictorInput | null {
  const team = getTeam(teamId);
  if (!team) return null;
  const members = listTeamMembers(teamId);
  let totalPipeline = 0;
  let totalDemos = 0;
  let sumClose = 0;
  let sumCall = 0;
  let n = 0;
  let forecastable = 0;

  for (const m of members) {
    const input = buildSalespersonPredictorInput(m.memberId);
    totalPipeline += input.pipelineValueCents;
    totalDemos += input.demosBooked;
    const d = input.closesWon + input.closesLost;
    if (d > 0) {
      sumClose += input.closesWon / d;
      n += 1;
    }
    sumCall += input.averageCallScore;
    forecastable += input.pipelineValueCents * 0.25;
  }

  return {
    teamId,
    teamName: team.name,
    memberIds: members.map((m) => m.memberId),
    totalPipelineValueCents: totalPipeline,
    teamCloseRate: n > 0 ? sumClose / n : 0.2,
    teamAverageCallScore: members.length ? sumCall / members.length : 60,
    totalBookedDemos: totalDemos,
    totalForecastableRevenueCents: Math.round(forecastable),
  };
}

/**
 * Filtered pipeline view — for v1 uses snapshot data for all known users in store.
 */
export function buildPipelinePredictorInput(filters: PipelinePredictorFilters): {
  totalPipelineCents: number;
  stageMix: Partial<Record<PipelineStage, number>>;
  repCount: number;
} {
  const store = loadRevenuePredictorStore();
  let total = 0;
  const mix: Partial<Record<PipelineStage, number>> = {};
  let repCount = 0;

  for (const snap of Object.values(store.snapshots)) {
    if (filters.hubType && snap.hubType && snap.hubType !== filters.hubType) continue;
    if (filters.region && snap.region && snap.region !== filters.region) continue;
    if (filters.dealType && snap.dealType && snap.dealType !== filters.dealType) continue;
    total += snap.pipelineValueCents;
    repCount += 1;
    for (const st of STAGES_OPEN) {
      const c = snap.conversionByStage[st] ?? 0;
      if (c > 0) mix[st] = (mix[st] ?? 0) + c;
    }
  }

  return { totalPipelineCents: total, stageMix: mix, repCount };
}

export function minDataForConfidence(input: SalespersonPredictorInput): { calls: number; dealOutcomes: number } {
  return {
    calls: input.totalCalls,
    dealOutcomes: input.closesWon + input.closesLost,
  };
}

export { CONFIDENCE_THRESHOLDS };
