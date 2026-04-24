import type { MemoryOutcomeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import * as repo from "@/modules/playbook-memory/repository/playbook-memory.repository";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import { playbookMemoryWriteService } from "@/modules/playbook-memory/services/playbook-memory-write.service";
import { playbookMemoryOutcomeService } from "@/modules/playbook-memory/services/playbook-memory-outcome.service";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";

const convertIdem = (leadId: string) => `crm_broker_lead_convert:${leadId}`;

async function latestLeadPlaybookAssignment(leadId: string) {
  return prisma.playbookAssignment.findFirst({
    where: { domain: "LEADS", entityType: "broker_lead", entityId: leadId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Non-blocking: attach bandit assignment outcome for the latest LEADS / broker_lead assignment.
 */
async function attachLeadAssignmentOutcome(params: {
  leadId: string;
  outcomeStatus: MemoryOutcomeStatus;
  memoryRecordId?: string | null;
  realizedConversion?: number | null;
}): Promise<void> {
  try {
    const a = await latestLeadPlaybookAssignment(params.leadId);
    if (!a) return;
    await playbookMemoryAssignmentService.attachAssignmentOutcome({
      assignmentId: a.id,
      memoryRecordId: params.memoryRecordId ?? undefined,
      outcomeStatus: params.outcomeStatus,
      realizedConversion: params.realizedConversion ?? undefined,
    });
  } catch (e) {
    playbookLog.warn("attachLeadAssignmentOutcome skipped", {
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Playbook-memory outcome hooks for broker CRM. No external sends. Never throws.
 */
export async function logLeadToDealConversion(params: {
  leadId: string;
  dealId: string;
  brokerUserId: string;
}): Promise<void> {
  try {
    const ctx: PlaybookComparableContext = {
      domain: "LEADS",
      entityType: "broker_lead",
      entityId: params.leadId,
      segment: { source: "broker_crm" },
      signals: { dealId: params.dealId, event: "lead_to_deal" },
    };
    const rec = await playbookMemoryWriteService.recordDecision({
      source: "SYSTEM",
      triggerEvent: "crm.broker_lead.deal_opened",
      actionType: "crm_lead_converted_to_deal",
      brokerId: params.brokerUserId,
      leadId: params.leadId,
      dealId: params.dealId,
      idempotencyKey: convertIdem(params.leadId),
      context: ctx,
      actionPayload: { leadId: params.leadId, dealId: params.dealId },
    });
    const mem = rec ?? (await repo.findMemoryRecordByIdempotencyKey(convertIdem(params.leadId)));
    void attachLeadAssignmentOutcome({
      leadId: params.leadId,
      outcomeStatus: "SUCCEEDED",
      memoryRecordId: mem?.id ?? null,
      realizedConversion: 1,
    });
  } catch (e) {
    playbookLog.warn("logLeadToDealConversion skipped", {
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function onDealClosedForPlaybookMemory(dealId: string): Promise<void> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, brokerId: true, status: true, executionMetadata: true },
    });
    if (!deal || deal.status !== "closed") {
      return;
    }
    const meta = deal.executionMetadata as { brokerCrmLeadId?: string } | null;
    const leadId = meta?.brokerCrmLeadId;
    if (leadId) {
      const mem = await repo.findMemoryRecordByIdempotencyKey(convertIdem(leadId));
      if (mem) {
        await playbookMemoryOutcomeService
          .markSucceeded({
            memoryRecordId: mem.id,
            outcomeSummary: { dealId, closed: true },
          })
          .catch((e) => {
            playbookLog.warn("playbook outcome update skipped", {
              id: mem.id,
              message: e instanceof Error ? e.message : String(e),
            });
          });
      }
      void attachLeadAssignmentOutcome({
        leadId,
        outcomeStatus: "SUCCEEDED",
        memoryRecordId: mem?.id ?? null,
        realizedConversion: 1,
      });
    }
    const closeCtx: PlaybookComparableContext = {
      domain: "DEALS",
      entityType: "deal",
      entityId: dealId,
      segment: { source: "broker_crm" },
      signals: { leadId: leadId ?? null, event: "deal_closed" },
    };
    await playbookMemoryWriteService.recordDecision({
      source: "SYSTEM",
      triggerEvent: "crm.deal.closed",
      actionType: "crm_deal_closed_outcome",
      brokerId: deal.brokerId ?? undefined,
      dealId,
      idempotencyKey: `crm_deal_closed:${dealId}`,
      context: closeCtx,
      actionPayload: { dealId, priorLeadId: leadId ?? null },
    });
  } catch (e) {
    playbookLog.warn("onDealClosedForPlaybookMemory skipped", {
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Deal cancelled / lost at the `Deal` row — update playbook-memory + assignment bandit. Never throws. */
export async function onDealCancelledForPlaybookMemory(dealId: string): Promise<void> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, brokerId: true, status: true, executionMetadata: true },
    });
    if (!deal || deal.status !== "cancelled") {
      return;
    }
    const meta = deal.executionMetadata as { brokerCrmLeadId?: string } | null;
    const leadId = meta?.brokerCrmLeadId;
    if (leadId) {
      const mem = await repo.findMemoryRecordByIdempotencyKey(convertIdem(leadId));
      if (mem) {
        await playbookMemoryOutcomeService
          .markFailed({
            memoryRecordId: mem.id,
            outcomeSummary: { dealId, cancelled: true },
          })
          .catch((e: unknown) => {
            playbookLog.warn("playbook outcome cancel skipped", {
              id: mem.id,
              message: e instanceof Error ? e.message : String(e),
            });
          });
      }
      void attachLeadAssignmentOutcome({
        leadId,
        outcomeStatus: "FAILED",
        memoryRecordId: mem?.id ?? null,
        realizedConversion: 0,
      });
    }
    const cancelCtx: PlaybookComparableContext = {
      domain: "DEALS",
      entityType: "deal",
      entityId: dealId,
      segment: { source: "broker_crm" },
      signals: { leadId: leadId ?? null, event: "deal_cancelled" },
    };
    await playbookMemoryWriteService.recordDecision({
      source: "SYSTEM",
      triggerEvent: "crm.deal.cancelled",
      actionType: "crm_deal_cancelled_outcome",
      brokerId: deal.brokerId ?? undefined,
      dealId,
      idempotencyKey: `crm_deal_cancelled:${dealId}`,
      context: cancelCtx,
      actionPayload: { dealId, priorLeadId: leadId ?? null },
    });
  } catch (e) {
    playbookLog.warn("onDealCancelledForPlaybookMemory skipped", {
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Call after `Deal.status` transitions to terminal `closed` or `cancelled` (e.g. API patch). */
export async function syncBrokerCrmDealTerminalPlaybookMemory(dealId: string): Promise<void> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { status: true },
    });
    if (!deal) return;
    if (deal.status === "closed") {
      await onDealClosedForPlaybookMemory(dealId);
    } else if (deal.status === "cancelled") {
      await onDealCancelledForPlaybookMemory(dealId);
    }
  } catch (e) {
    playbookLog.warn("syncBrokerCrmDealTerminalPlaybookMemory skipped", {
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
