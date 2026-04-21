import type { MemoryOutcomeStatus } from "@prisma/client";
import { playbookLog } from "../playbook-memory.logger";
import { playbookTelemetry } from "../playbook-memory.telemetry";
import * as repo from "../repository/playbook-memory.repository";
import type {
  AppendOutcomeMetricInput,
  RecordDecisionInput,
  RecordOutcomeUpdateInput,
} from "../types/playbook-memory.types";
import { learnFromMemoryRecord } from "./playbook-memory-learning.service";
import {
  buildMarketKey,
  buildSegmentKey,
  buildSimilarityFingerprint,
  extractComparableFeatures,
} from "../utils/playbook-memory-fingerprint";

export async function recordDecision(input: RecordDecisionInput) {
  if (input.idempotencyKey) {
    const existing = await repo.findMemoryRecordByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      playbookLog.info("recordDecision idempotent hit", { id: existing.id });
      return existing;
    }
  }

  const fingerprint = buildSimilarityFingerprint(input.context);
  const segmentKey = buildSegmentKey(input.context);
  const marketKey = buildMarketKey(input.context);

  const row = await repo.createMemoryRecord({
    domain: input.context.domain,
    source: input.source,
    triggerEvent: input.triggerEvent,
    actionType: input.actionType,
    actionVersion: input.actionVersion ?? undefined,
    actorUserId: input.actorUserId ?? undefined,
    actorSystem: input.actorSystem ?? undefined,
    actorRole: input.actorRole ?? undefined,
    listingId: input.listingId ?? undefined,
    leadId: input.leadId ?? undefined,
    dealId: input.dealId ?? undefined,
    bookingId: input.bookingId ?? undefined,
    brokerId: input.brokerId ?? undefined,
    customerId: input.customerId ?? undefined,
    memoryPlaybookId: input.memoryPlaybookId ?? undefined,
    memoryPlaybookVersionId: input.memoryPlaybookVersionId ?? undefined,
    idempotencyKey: input.idempotencyKey ?? undefined,
    contextSnapshot: extractComparableFeatures(input.context) as object,
    actionPayload: input.actionPayload as object,
    policySnapshot: input.policySnapshot as object | undefined,
    riskSnapshot: input.riskSnapshot as object | undefined,
    objectiveSnapshot: input.objectiveSnapshot as object | undefined,
    similarityFingerprint: fingerprint,
    segmentKey,
    marketKey,
    initialConfidence: input.initialConfidence ?? undefined,
    safetyScore: input.safetyScore ?? undefined,
    expectedValue: input.expectedValue ?? undefined,
    outcomeStatus: "PENDING",
  });

  playbookTelemetry.writesCount += 1;
  playbookLog.info("recordDecision written", {
    id: row.id,
    domain: row.domain,
    actionType: row.actionType,
  });
  return row;
}

/** Alias when the row represents an executed playbook step (same storage). */
export async function recordExecution(input: RecordDecisionInput) {
  return recordDecision(input);
}

export async function recordOutcomeUpdate(input: RecordOutcomeUpdateInput) {
  const existing = await repo.findMemoryRecordById(input.memoryRecordId);
  if (!existing) {
    playbookLog.warn("recordOutcomeUpdate missing record", { id: input.memoryRecordId });
    throw new Error("memory_record_not_found");
  }

  const row = await repo.updateMemoryRecord(input.memoryRecordId, {
    outcomeStatus: (input.outcomeStatus ?? existing.outcomeStatus) as MemoryOutcomeStatus,
    outcomeSummary: input.outcomeSummary as object | undefined,
    realizedValue: input.realizedValue ?? undefined,
    realizedRevenue: input.realizedRevenue ?? undefined,
    realizedConversion: input.realizedConversion ?? undefined,
    realizedLatencyMs: input.realizedLatencyMs ?? undefined,
    realizedRiskScore: input.realizedRiskScore ?? undefined,
    outcomeEvaluatedAt: new Date(),
  });

  playbookTelemetry.outcomesUpdatedCount += 1;
  playbookLog.info("recordOutcomeUpdate", { id: row.id, outcomeStatus: row.outcomeStatus });

  if (row.memoryPlaybookId && input.outcomeStatus && input.outcomeStatus !== "PENDING") {
    await learnFromMemoryRecord(row.id).catch((e: unknown) => {
      playbookLog.warn("learnFromMemoryRecord deferred", {
        message: e instanceof Error ? e.message : String(e),
      });
    });
  }

  return row;
}

export async function appendOutcomeMetric(input: AppendOutcomeMetricInput) {
  await repo.appendOutcomeMetric({
    memoryRecord: { connect: { id: input.memoryRecordId } },
    metricKey: input.metricKey,
    metricValue: input.metricValue ?? undefined,
    metricText: input.metricText ?? undefined,
    metricJson: input.metricJson as object | undefined,
    observedAt: input.observedAt ?? new Date(),
    source: input.source ?? undefined,
  });
  playbookLog.info("appendOutcomeMetric", { memoryRecordId: input.memoryRecordId, metricKey: input.metricKey });
}
