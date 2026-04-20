import type { GrowthContentBrief } from "./growth-content-brief.service";
import type { GrowthExecutionResult } from "./growth.types";
import type { GrowthOpportunity } from "./growth.types";
import type { GrowthSignal } from "./growth.types";
import {
  markGrowthOpportunityReviewed as markReviewed,
  persistGrowthBriefRecord,
  persistGrowthOpportunityRecord,
  persistGrowthSignalSnapshot,
} from "./growth-repository";
import { trackGrowthBriefCreated, trackGrowthOpportunityCreated, trackGrowthTaskCreated } from "./growth-monitoring.service";

export async function createGrowthTask(input: {
  title: string;
  opportunityId: string;
  metadata?: Record<string, unknown>;
}): Promise<GrowthExecutionResult> {
  trackGrowthTaskCreated(input.opportunityId, { titleLen: input.title.length });
  return {
    ok: true,
    detail: "Recorded as internal task advisory — no outbound side effects.",
    recordedId: null,
    metadata: { title: input.title, ...input.metadata },
  };
}

export async function persistGrowthOpportunitySafe(opportunity: GrowthOpportunity): Promise<GrowthExecutionResult> {
  const r = await persistGrowthOpportunityRecord(opportunity);
  trackGrowthOpportunityCreated(opportunity.id, { persisted: r.ok });
  return {
    ok: r.ok,
    detail: r.ok ? "Opportunity persisted to candidate store" : "Persist skipped (db unavailable)",
    recordedId: r.id,
    metadata: {},
  };
}

export async function persistGrowthBriefSafe(params: {
  opportunityId: string;
  brief: GrowthContentBrief;
}): Promise<GrowthExecutionResult> {
  const r = await persistGrowthBriefRecord(params);
  trackGrowthBriefCreated(params.opportunityId, { persisted: r.ok });
  return {
    ok: r.ok,
    detail: r.ok ? "Brief persisted as draft metadata" : "Brief persist skipped",
    recordedId: r.id,
    metadata: {},
  };
}

export async function persistSignalSnapshotSafe(signals: GrowthSignal[], snapshotId: string): Promise<GrowthExecutionResult> {
  const r = await persistGrowthSignalSnapshot(signals, snapshotId);
  return {
    ok: r.ok,
    detail: r.ok ? "Signal snapshot envelope recorded" : "Signal snapshot skipped",
    recordedId: r.id,
    metadata: { count: signals.length },
  };
}

export async function markGrowthOpportunityReviewed(candidateId: string): Promise<GrowthExecutionResult> {
  const r = await markReviewed(candidateId);
  return {
    ok: r.ok,
    detail: r.ok ? "Marked reviewed" : "Review mark skipped",
    recordedId: candidateId,
    metadata: {},
  };
}
