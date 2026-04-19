/**
 * Lead pricing results — observation capture and conservative outcome readouts.
 * Does not touch Stripe, checkout, or lead unlock pricing engines.
 */

import { prisma } from "@/lib/db";
import type { LeadMonetizationConfidenceLevel } from "@/modules/leads/lead-monetization-control.types";
import type {
  LeadPricingBaselineSnapshot,
  LeadPricingModePerformance,
  LeadPricingModeUsed,
  LeadPricingObservedOutcome,
  LeadPricingOperatorAction,
  LeadPricingOutcomeSummary,
  LeadPricingResultsAdminPayload,
} from "@/modules/leads/lead-pricing-results.types";
import {
  leadProgressIndex,
  scoreLeadPricingOutcome,
  type CurrentLeadSignals,
} from "@/modules/leads/lead-pricing-results-scoring.service";
import {
  monitorLeadPricingModePerformanceBuilt,
  monitorLeadPricingObservationCaptured,
  monitorLeadPricingOutcomeBuckets,
  monitorLeadPricingOutcomeEvaluated,
} from "@/modules/leads/lead-pricing-results-monitoring.service";
import { leadPricingResultsFlags } from "@/config/feature-flags";

function leadSelectForSignals() {
  return {
    pipelineStatus: true,
    pipelineStage: true,
    lecipmCrmStage: true,
    contactUnlockedAt: true,
    engagementScore: true,
  } as const;
}

export function buildBaselineSnapshotFromLead(lead: {
  pipelineStatus: string | null;
  pipelineStage: string | null;
  lecipmCrmStage: string | null;
  contactUnlockedAt: Date | null;
  engagementScore: number | null;
}): LeadPricingBaselineSnapshot {
  return {
    pipelineStatus: lead.pipelineStatus,
    pipelineStage: lead.pipelineStage,
    lecipmCrmStage: lead.lecipmCrmStage,
    contactUnlocked: Boolean(lead.contactUnlockedAt),
    engagementScore: lead.engagementScore ?? 0,
    progressIndex: leadProgressIndex(lead),
  };
}

export function currentSignalsFromLead(lead: {
  pipelineStatus: string | null;
  pipelineStage: string | null;
  lecipmCrmStage: string | null;
  contactUnlockedAt: Date | null;
  engagementScore: number | null;
}): CurrentLeadSignals {
  return {
    pipelineStatus: lead.pipelineStatus,
    pipelineStage: lead.pipelineStage,
    lecipmCrmStage: lead.lecipmCrmStage,
    contactUnlocked: Boolean(lead.contactUnlockedAt),
    engagementScore: lead.engagementScore ?? 0,
    progressIndex: leadProgressIndex(lead),
  };
}

export type CaptureLeadPricingObservationInput = {
  leadId: string;
  pricingModeUsed: LeadPricingModeUsed;
  displayedAdvisoryPrice: number;
  basePrice: number;
  confidenceLevel: LeadMonetizationConfidenceLevel;
  operatorActionTaken?: LeadPricingOperatorAction | null;
  qualityBand?: string;
  qualityScore?: number;
  demandLevel?: string;
  demandScore?: number;
};

export async function captureLeadPricingObservation(
  input: CaptureLeadPricingObservationInput,
): Promise<LeadPricingObservedOutcome | null> {
  if (!leadPricingResultsFlags.leadPricingResultsV1) return null;

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: leadSelectForSignals(),
  });
  if (!lead) return null;

  const baseline = buildBaselineSnapshotFromLead(lead);
  const merged: LeadPricingBaselineSnapshot = {
    ...baseline,
    qualityBand: input.qualityBand,
    qualityScore: input.qualityScore,
    demandLevel: input.demandLevel,
    demandScore: input.demandScore,
  };

  const row = await prisma.leadPricingResultObservation.create({
    data: {
      leadId: input.leadId,
      pricingModeUsed: input.pricingModeUsed,
      displayedAdvisoryPrice: Math.round(input.displayedAdvisoryPrice),
      basePrice: Math.round(input.basePrice),
      confidenceLevel: input.confidenceLevel,
      operatorActionTaken: input.operatorActionTaken ?? null,
      baselineSnapshotJson: merged as object,
    },
  });

  monitorLeadPricingObservationCaptured({
    leadId: input.leadId,
    observationId: row.id,
    mode: input.pricingModeUsed,
  });

  return {
    id: row.id,
    leadId: row.leadId,
    pricingModeUsed: row.pricingModeUsed as LeadPricingModeUsed,
    displayedAdvisoryPrice: row.displayedAdvisoryPrice,
    basePrice: row.basePrice,
    confidenceLevel: row.confidenceLevel as LeadMonetizationConfidenceLevel,
    measuredAt: row.measuredAt.toISOString(),
    operatorActionTaken: row.operatorActionTaken as LeadPricingOperatorAction | null,
  };
}

/** Fire-and-forget hook when operator creates an active override — internal audit trail only. */
export async function tryRecordLeadPricingResultOnOverride(input: {
  leadId: string;
  overridePrice: number;
  basePrice: number;
  systemSuggestedPrice: number;
}): Promise<void> {
  if (!leadPricingResultsFlags.leadPricingResultsV1) return;
  try {
    await captureLeadPricingObservation({
      leadId: input.leadId,
      pricingModeUsed: "override",
      displayedAdvisoryPrice: input.overridePrice,
      basePrice: input.basePrice,
      confidenceLevel: "medium",
      operatorActionTaken: "used",
    });
  } catch {
    /* non-fatal */
  }
}

export async function evaluateLeadPricingOutcome(observationId: string): Promise<LeadPricingOutcomeSummary | null> {
  if (!leadPricingResultsFlags.leadPricingResultsV1) return null;

  const obs = await prisma.leadPricingResultObservation.findUnique({ where: { id: observationId } });
  if (!obs) return null;

  const lead = await prisma.lead.findUnique({
    where: { id: obs.leadId },
    select: leadSelectForSignals(),
  });
  if (!lead) return null;

  const summary = buildLeadPricingOutcomeSummary({
    observation: obs,
    currentLead: lead,
  });

  await prisma.leadPricingResultObservation.update({
    where: { id: observationId },
    data: {
      evaluatedAt: new Date(),
      outcomeBand: summary.outcomeBand,
      outcomeExplanation: summary.explanation,
      outcomeWarningsJson: summary.warnings as object,
    },
  });

  monitorLeadPricingOutcomeEvaluated({
    leadId: obs.leadId,
    observationId,
    outcomeBand: summary.outcomeBand,
  });
  monitorLeadPricingOutcomeBuckets({ [summary.outcomeBand]: 1 });

  return summary;
}

export function buildLeadPricingOutcomeSummary(input: {
  observation: {
    leadId: string;
    pricingModeUsed: string;
    measuredAt: Date;
    baselineSnapshotJson: unknown;
  };
  currentLead: {
    pipelineStatus: string | null;
    pipelineStage: string | null;
    lecipmCrmStage: string | null;
    contactUnlockedAt: Date | null;
    engagementScore: number | null;
  };
}): LeadPricingOutcomeSummary {
  const baseline = input.observation.baselineSnapshotJson as LeadPricingBaselineSnapshot;
  const current = currentSignalsFromLead(input.currentLead);
  const endAt = new Date();
  const daysElapsed = Math.floor(
    (endAt.getTime() - input.observation.measuredAt.getTime()) / 86400000,
  );

  const scored = scoreLeadPricingOutcome({
    baseline,
    current,
    daysElapsed,
  });

  const window = {
    startAt: input.observation.measuredAt.toISOString(),
    endAt: endAt.toISOString(),
    days: Math.max(0, daysElapsed),
  };

  return {
    leadId: input.observation.leadId,
    pricingModeUsed: input.observation.pricingModeUsed as LeadPricingModeUsed,
    sampleStatus: scored.sampleStatus,
    window,
    leadProgressDelta: scored.leadProgressDelta,
    unlockDelta: scored.unlockDelta,
    conversionDelta: scored.conversionDelta,
    revenueDelta: null,
    outcomeBand: scored.outcomeBand,
    explanation: scored.explanation,
    warnings: scored.warnings,
  };
}

export async function getLatestLeadPricingOutcomeSummaryForLead(
  leadId: string,
): Promise<LeadPricingOutcomeSummary | null> {
  if (!leadPricingResultsFlags.leadPricingResultsV1) return null;

  const obs = await prisma.leadPricingResultObservation.findFirst({
    where: { leadId },
    orderBy: { measuredAt: "desc" },
  });
  if (!obs) return null;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: leadSelectForSignals(),
  });
  if (!lead) return null;

  return buildLeadPricingOutcomeSummary({ observation: obs, currentLead: lead });
}

export async function getLeadPricingResultsForAdmin(leadId: string): Promise<LeadPricingResultsAdminPayload | null> {
  if (!leadPricingResultsFlags.leadPricingResultsV1) return null;

  const obs = await prisma.leadPricingResultObservation.findFirst({
    where: { leadId },
    orderBy: { measuredAt: "desc" },
  });
  if (!obs) {
    return { latestObservationId: null, outcomeSummary: null };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: leadSelectForSignals(),
  });
  if (!lead) {
    return { latestObservationId: null, outcomeSummary: null };
  }

  return {
    latestObservationId: obs.id,
    outcomeSummary: buildLeadPricingOutcomeSummary({ observation: obs, currentLead: lead }),
  };
}

export async function buildLeadPricingModePerformance(): Promise<LeadPricingModePerformance[]> {
  if (!leadPricingResultsFlags.leadPricingResultsV1) return [];

  const rows = await prisma.leadPricingResultObservation.findMany({
    where: { evaluatedAt: { not: null }, outcomeBand: { not: null } },
    select: { pricingModeUsed: true, outcomeBand: true },
  });

  const modes = new Map<
    string,
    { pos: number; neu: number; neg: number; ins: number }
  >();

  for (const r of rows) {
    const m = r.pricingModeUsed;
    if (!modes.has(m)) modes.set(m, { pos: 0, neu: 0, neg: 0, ins: 0 });
    const b = modes.get(m)!;
    if (r.outcomeBand === "positive") b.pos++;
    else if (r.outcomeBand === "neutral") b.neu++;
    else if (r.outcomeBand === "negative") b.neg++;
    else if (r.outcomeBand === "insufficient_data") b.ins++;
  }

  const out: LeadPricingModePerformance[] = [];

  for (const [mode, c] of modes) {
    const total = c.pos + c.neu + c.neg + c.ins;
    const scored = c.pos + c.neu + c.neg;
    const successRate = scored > 0 ? c.pos / scored : null;
    const confidenceLevel: LeadPricingModePerformance["confidenceLevel"] =
      total >= 15 ? "high" : total >= 6 ? "medium" : "low";

    out.push({
      mode: mode as LeadPricingModeUsed,
      totalCases: total,
      positiveCount: c.pos,
      neutralCount: c.neu,
      negativeCount: c.neg,
      insufficientCount: c.ins,
      successRate,
      confidenceLevel,
    });
  }

  out.sort((a, b) => a.mode.localeCompare(b.mode));
  monitorLeadPricingModePerformanceBuilt({ modes: out.length });
  return out;
}
