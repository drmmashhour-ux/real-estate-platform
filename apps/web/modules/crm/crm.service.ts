import type { LecipmBrokerCrmLeadStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluatePipelineTransition } from "./pipeline.engine";
import type { PipelineActivityKind } from "./crm.types";
import { conversionLog, crmLog } from "./crm-pipeline-logger";

export type RecordPipelineEventInput = {
  type: string;
  entityType: "broker_crm_lead" | "deal" | "lead" | "pipeline";
  entityId: string;
  message: string;
  brokerUserId?: string;
  metadata?: Record<string, unknown>;
};

/** Persist unified CRM pipeline audit row (Law 25 — minimize PII in metadata; prefer ids + aggregates). */
export async function recordCrmPipelineEvent(input: RecordPipelineEventInput): Promise<void> {
  try {
    await prisma.crmPipelineEvent.create({
      data: {
        type: input.type.slice(0, 96),
        entityType: input.entityType.slice(0, 32),
        entityId: input.entityId,
        message: input.message.slice(0, 20_000),
        brokerUserId: input.brokerUserId ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    });
    crmLog.info("recordCrmPipelineEvent", { type: input.type, entityType: input.entityType, entityId: input.entityId });
  } catch (e) {
    crmLog.error("recordCrmPipelineEvent_failed", {
      message: e instanceof Error ? e.message : String(e),
      type: input.type,
    });
    throw e;
  }
}

/** Compose engine output for UI hints / autopilot drafts (does not mutate DB). */
export function previewNextPipelineStep(params: {
  currentStatus: LecipmBrokerCrmLeadStatus;
  activity: PipelineActivityKind;
  intentScore?: number;
  priorityLabel?: "low" | "medium" | "high";
}) {
  return evaluatePipelineTransition(params);
}

/**
 * Automation hooks — **do not send marketing email directly here** without consent + CASL/Law 25 checks.
 * Wire ESP (Resend/SendGrid) via existing notifications services when templates exist.
 */
export async function onBrokerCrmLeadCreated(leadId: string, brokerUserId: string): Promise<void> {
  conversionLog.info("onBrokerCrmLeadCreated", { leadId, brokerUserId });
  await recordCrmPipelineEvent({
    type: "lead_created",
    entityType: "broker_crm_lead",
    entityId: leadId,
    message: "New broker CRM lead — automation: queue welcome workflow (templates/consent gated).",
    brokerUserId,
    metadata: { automationRule: "new_lead_welcome_pending" },
  });
  /** TODO: enqueue transactional welcome when double opt-in / listing inquiry context satisfies privacy policy */
}

export async function onDealIntelligenceStageUpdated(dealId: string, stage: string): Promise<void> {
  conversionLog.info("deal_intelligence_stage", { dealId, stage });
  await recordCrmPipelineEvent({
    type: "deal_intelligence_stage",
    entityType: "deal",
    entityId: dealId,
    message: `Deal intelligence stage: ${stage}`,
    metadata: { stage },
  });
}
