import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import * as repo from "@/modules/playbook-memory/repository/playbook-memory.repository";
import { playbookMemoryWriteService } from "@/modules/playbook-memory/services/playbook-memory-write.service";
import { playbookMemoryOutcomeService } from "@/modules/playbook-memory/services/playbook-memory-outcome.service";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";

const convertIdem = (leadId: string) => `crm_broker_lead_convert:${leadId}`;

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
      entityType: "lecipm_broker_crm_lead",
      entityId: params.leadId,
      segment: { source: "broker_crm" },
      signals: { dealId: params.dealId, event: "lead_to_deal" },
    };
    await playbookMemoryWriteService.recordDecision({
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
