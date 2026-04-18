import type { AssistantRecommendation } from "@/modules/operator/operator.types";
import { oneBrainV2Flags, platformCoreFlags, isPlatformCoreAuditEffective } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import type { CoreDecisionRecord, CoreDecisionStatus, CoreSystemSource } from "./platform-core.types";
import { assistantRecommendationToCoreFields } from "./platform-ingest-mapping";
import { createDecisionInputToBrainInput } from "./one-brain.mapping";
import { processBrainDecision } from "./one-brain.processor";
import {
  createApproval,
  createAuditEvent,
  createDecision,
  createTask,
  findDecisionByAdsIngestDedupeKey,
  findRecentDuplicateAdsDecision,
  getDecisionById,
  type CreateAuditInput,
  type CreateDecisionInput,
  type CreateTaskInput,
  updateDecisionStatus,
} from "./platform-core.repository";
import { runPlatformExecution } from "./platform-execution.adapter";
import type { BrainLearningSource } from "./brain-v2.types";
import { getCurrentSourceWeights } from "./brain-v2.repository";
import { getSourceAdaptiveWeight } from "./trust-engine.service";
import { emitPlatformCoreBrainFeedback } from "./brain-outcome-ingestion.service";
import { computeDecisionPriority } from "./platform-core-priority.service";

function coreSourceToLearningKey(source: CreateDecisionInput["source"]): BrainLearningSource {
  if (source === "OPERATOR") return "UNIFIED";
  return source as BrainLearningSource;
}

async function enrichDecisionWithOneBrain(input: CreateDecisionInput): Promise<CreateDecisionInput> {
  let sourceWeightMultiplier: number | null = null;
  if (platformCoreFlags.platformCoreV1 && oneBrainV2Flags.oneBrainV2AdaptiveV1) {
    const weights = await getCurrentSourceWeights();
    sourceWeightMultiplier = getSourceAdaptiveWeight(coreSourceToLearningKey(input.source), weights);
  }
  const brainIn = createDecisionInputToBrainInput(input, { sourceWeightMultiplier });
  const out = processBrainDecision(brainIn);
  return {
    ...input,
    metadata: {
      ...(input.metadata ?? {}),
      trustScore: out.trustScore,
      baseTrustScore: out.baseTrustScore,
      sourceWeightApplied: out.sourceWeightApplied,
      executionPriority: out.executionPriority,
      rankingImpact: out.rankingImpact,
      executionAllowed: out.executionAllowed,
      oneBrainReasoning: out.reasoning,
      oneBrainAdaptationReason: out.adaptationReason,
    },
  };
}

export async function registerDecision(input: CreateDecisionInput): Promise<CoreDecisionRecord> {
  if (!platformCoreFlags.platformCoreV1) {
    throw new Error("Platform core is disabled (FEATURE_PLATFORM_CORE_V1).");
  }
  if (input.source === "ADS" && platformCoreFlags.platformCoreAdsIngestionV1) {
    const meta = input.metadata && typeof input.metadata === "object" ? (input.metadata as Record<string, unknown>) : {};
    const dk = meta.adsIngestDedupeKey;
    if (typeof dk === "string") {
      const byKey = await findDecisionByAdsIngestDedupeKey(dk);
      if (byKey) return byKey;
    } else {
      const recent = await findRecentDuplicateAdsDecision(input);
      if (recent) return recent;
    }
  }
  const toCreate = await enrichDecisionWithOneBrain(input);
  const { id } = await createDecision(toCreate);
  if (isPlatformCoreAuditEffective()) {
    await createAuditEvent({
      eventType: PLATFORM_CORE_AUDIT.DECISION_REGISTERED,
      source: input.source,
      entityType: input.entityType,
      entityId: input.entityId,
      message: `Registered decision: ${input.title}`,
      metadata: { decisionId: id, actionType: input.actionType },
    });
  }
  const row = await getDecisionById(id);
  if (!row) throw new Error("registerDecision: row missing after create");
  if (platformCoreFlags.platformCorePriorityV1) {
    try {
      await computeDecisionPriority(row);
    } catch {
      /* best-effort priority snapshot */
    }
  }
  return row;
}

export async function ingestFromAssistantRecommendations(recs: AssistantRecommendation[]): Promise<{ created: number }> {
  if (!platformCoreFlags.platformCoreV1) {
    return { created: 0 };
  }
  const toIngest =
    platformCoreFlags.platformCoreAdsIngestionV1 ? recs.filter((r) => r.source !== "ADS") : recs;
  let created = 0;
  for (const r of toIngest) {
    const f = assistantRecommendationToCoreFields(r);
    await registerDecision({
      source: f.source,
      entityType: f.entityType,
      entityId: f.entityId,
      title: f.title,
      summary: f.summary,
      reason: f.reason,
      confidenceScore: f.confidenceScore,
      evidenceScore: f.evidenceScore,
      status: f.status,
      actionType: f.actionType,
      expectedImpact: f.expectedImpact,
      warnings: f.warnings,
      blockers: f.blockers,
      metadata: f.metadata,
    });
    created += 1;
  }
  return { created };
}

export async function recordAudit(input: CreateAuditInput): Promise<{ id: string } | null> {
  if (!isPlatformCoreAuditEffective()) return null;
  return createAuditEvent(input);
}

export async function approveDecision(input: {
  decisionId: string;
  reviewerUserId: string;
  note?: string | null;
}): Promise<CoreDecisionRecord> {
  if (!platformCoreFlags.platformCoreApprovalsV1) {
    throw new Error("Platform core approvals are disabled (FEATURE_PLATFORM_CORE_APPROVALS_V1).");
  }
  await createApproval({
    decisionId: input.decisionId,
    status: "APPROVED",
    reviewerUserId: input.reviewerUserId,
    reviewerNote: input.note,
  });
  return updateDecisionStatus(input.decisionId, "APPROVED", {
    auditEventType: PLATFORM_CORE_AUDIT.DECISION_APPROVED,
    auditMessage: `Approved by ${input.reviewerUserId}`,
  });
}

export async function dismissDecision(input: {
  decisionId: string;
  reviewerUserId: string;
  note?: string | null;
}): Promise<CoreDecisionRecord> {
  if (!platformCoreFlags.platformCoreApprovalsV1) {
    throw new Error("Platform core approvals are disabled (FEATURE_PLATFORM_CORE_APPROVALS_V1).");
  }
  await createApproval({
    decisionId: input.decisionId,
    status: "DISMISSED",
    reviewerUserId: input.reviewerUserId,
    reviewerNote: input.note,
  });
  const updated = await updateDecisionStatus(input.decisionId, "DISMISSED", {
    auditEventType: PLATFORM_CORE_AUDIT.DECISION_DISMISSED,
    auditMessage: `Dismissed by ${input.reviewerUserId}`,
  });
  try {
    await emitPlatformCoreBrainFeedback({ decision: updated, kind: "dismissed" });
  } catch {
    /* feedback is best-effort */
  }
  return updated;
}

export async function blockDecision(decisionId: string, reason?: string): Promise<CoreDecisionRecord> {
  return updateDecisionStatus(decisionId, "BLOCKED", {
    auditEventType: PLATFORM_CORE_AUDIT.DECISION_BLOCKED,
    auditMessage: reason ?? "Blocked by policy",
    metadata: reason ? { reason } : undefined,
    mergeMetadata: true,
  });
}

export async function executeDecisionInternal(input: {
  decisionId: string;
  actorUserId?: string | null;
}): Promise<{ decision: CoreDecisionRecord; result: Record<string, unknown> }> {
  if (!platformCoreFlags.platformCoreExecutionV1) {
    throw new Error("Platform core execution is disabled (FEATURE_PLATFORM_CORE_EXECUTION_V1).");
  }
  const d = await getDecisionById(input.decisionId);
  if (!d) throw new Error("Decision not found");
  if (d.status !== "APPROVED") {
    throw new Error(`Execution requires APPROVED status; got ${d.status}`);
  }

  const meta = d.metadata && typeof d.metadata === "object" ? (d.metadata as Record<string, unknown>) : {};
  if (typeof meta.trustScore === "number") {
    if (meta.executionAllowed === false) {
      throw new Error("One Brain: execution not allowed for this decision (trust / safety policy).");
    }
    if (meta.trustScore < 0.65) {
      throw new Error("One Brain: trust score below threshold — use monitoring or simulation only.");
    }
  }

  const exec = await runPlatformExecution(d);
  if (!exec.ok) {
    await updateDecisionStatus(input.decisionId, "FAILED", {
      auditEventType: PLATFORM_CORE_AUDIT.DECISION_FAILED,
      auditMessage: exec.error ?? "Execution failed",
      metadata: { error: exec.error },
      mergeMetadata: true,
    });
    const failed = await getDecisionById(input.decisionId);
    if (!failed) throw new Error("Decision missing after failed execution");
    try {
      await emitPlatformCoreBrainFeedback({ decision: failed, kind: "failed" });
    } catch {
      /* best-effort negative learning signal */
    }
    return { decision: failed, result: { error: exec.error } };
  }

  const updated = await updateDecisionStatus(input.decisionId, "EXECUTED", {
    auditEventType: PLATFORM_CORE_AUDIT.DECISION_EXECUTED,
    auditMessage: "Internal execution completed",
    metadata: {
      result: exec.result,
      executedBy: input.actorUserId ?? "system",
    },
    mergeMetadata: true,
  });

  try {
    await emitPlatformCoreBrainFeedback({ decision: updated, kind: "executed" });
  } catch {
    /* feedback is best-effort */
  }

  return { decision: updated, result: exec.result };
}

export async function rollbackDecisionInternal(input: {
  decisionId: string;
  actorUserId?: string | null;
  note?: string | null;
}): Promise<CoreDecisionRecord> {
  if (!platformCoreFlags.platformCoreExecutionV1) {
    throw new Error("Platform core execution is disabled (FEATURE_PLATFORM_CORE_EXECUTION_V1).");
  }
  const d = await getDecisionById(input.decisionId);
  if (!d) throw new Error("Decision not found");
  if (d.status !== "EXECUTED") {
    throw new Error(`Rollback requires EXECUTED status; got ${d.status}`);
  }

  if (isPlatformCoreAuditEffective()) {
    await createAuditEvent({
      eventType: PLATFORM_CORE_AUDIT.DECISION_ROLLBACK,
      source: d.source,
      entityType: d.entityType,
      entityId: d.entityId,
      message: input.note ?? "Rollback requested",
      metadata: { decisionId: input.decisionId, actor: input.actorUserId },
    });
  }

  return updateDecisionStatus(input.decisionId, "ROLLED_BACK", {
    auditEventType: PLATFORM_CORE_AUDIT.DECISION_ROLLBACK,
    auditMessage: input.note ?? "Rolled back internal execution marker",
    mergeMetadata: true,
    metadata: { rollbackAt: new Date().toISOString() },
  });
}

export async function queueTask(input: CreateTaskInput): Promise<{ id: string }> {
  const ref = await createTask(input);
  if (isPlatformCoreAuditEffective()) {
    await createAuditEvent({
      eventType: PLATFORM_CORE_AUDIT.TASK_QUEUED,
      source: input.source,
      entityType: input.entityType,
      entityId: input.entityId,
      message: `Queued task ${input.taskType}`,
      metadata: { taskId: ref.id },
    });
  }
  return ref;
}
