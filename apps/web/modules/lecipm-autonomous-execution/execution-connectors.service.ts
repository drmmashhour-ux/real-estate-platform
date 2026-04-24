import type { LecipmExecutionTask } from "@prisma/client";
import { ActionPipelineType } from "@prisma/client";
import { prisma } from "@repo/db";
import { createActionPipelineRecord } from "@/modules/action-pipeline/action-pipeline.service";

/**
 * Side-effect handlers — drafts and internal prep only. No contract dispatch, no payments, no investor solicitation sends.
 */
export async function runExecutionConnector(task: LecipmExecutionTask): Promise<Record<string, unknown>> {
  const payload = (task.payloadJson ?? {}) as Record<string, unknown>;

  switch (task.taskType) {
    case "MESSAGE": {
      const convId = task.entityId;
      const draft =
        typeof payload.suggestedBody === "string"
          ? payload.suggestedBody
          : "Follow-up message (draft) — personalize before any outbound send.";
      const conv = await prisma.crmConversation.findUnique({ where: { id: convId }, select: { id: true } });
      if (!conv) return { skipped: true, reason: "conversation_not_found" };
      const msg = await prisma.crmMessage.create({
        data: {
          conversationId: convId,
          sender: "ai",
          content: `[DRAFT — not sent — broker review required / brouillon — révision requise]\n${draft}`,
        },
      });
      return { crmMessageId: msg.id, draftOnly: true };
    }
    case "FOLLOW_UP": {
      const leadId =
        typeof payload.leadId === "string" ? payload.leadId : task.entityId.startsWith("lead:") ? task.entityId.slice(5) : null;
      if (!leadId) return { skipped: true, reason: "missing_lead_id" };
      await prisma.leadTask.create({
        data: {
          leadId,
          title: typeof payload.title === "string" ? payload.title : "AI suggested CRM follow-up",
          status: "pending",
          priority: "medium",
          metadata: { source: "lecipm_execution_task", taskId: task.id },
        },
      });
      return { leadId, leadTaskCreated: true, internalOnly: true };
    }
    case "OFFER_PREP": {
      const dealId = task.entityType === "DEAL" ? task.entityId : String(payload.dealId ?? "");
      if (!dealId) return { skipped: true, reason: "missing_deal_id" };
      const pipeline = await createActionPipelineRecord({
        type: ActionPipelineType.DEAL,
        dealId,
        aiGenerated: true,
        initialStatus: "READY_FOR_SIGNATURE",
        actorUserId: null,
        dataJson: {
          source: "lecipm_execution_task",
          taskId: task.id,
          note: "AI prepared offer-related deal action — broker must review, sign, then execution hooks may run.",
        },
      });
      await prisma.lecipmExecutionTask.update({
        where: { id: task.id },
        data: { linkedActionPipelineId: pipeline.id },
      });
      return { actionPipelineId: pipeline.id, draftOnly: true, status: "READY_FOR_SIGNATURE" };
    }
    case "INVESTOR_PACKET_PREP": {
      const dealId = task.entityType === "DEAL" ? task.entityId : String(payload.dealId ?? "");
      const pipeline = await prisma.actionPipeline.create({
        data: {
          type: ActionPipelineType.INVESTMENT,
          status: ActionPipelineStatus.DRAFT,
          aiGenerated: true,
          dealId: dealId || null,
          dataJson: {
            source: "lecipm_execution_task",
            taskId: task.id,
            note: "Investor packet prep — no public solicitation; release only after approval.",
          },
        },
      });
      await prisma.lecipmExecutionTask.update({
        where: { id: task.id },
        data: { linkedActionPipelineId: pipeline.id },
      });
      return { actionPipelineId: pipeline.id, draftOnly: true, noPublicSolicitation: true };
    }
    case "DISCLOSURE_PREP":
    case "DOCUMENT_PREP": {
      const dealId = task.entityType === "DEAL" ? task.entityId : String(payload.dealId ?? "");
      const pipeline = await createActionPipelineRecord({
        type: ActionPipelineType.DOCUMENT,
        dealId: dealId || null,
        aiGenerated: true,
        initialStatus: "READY_FOR_SIGNATURE",
        actorUserId: null,
        dataJson: {
          source: "lecipm_execution_task",
          taskId: task.id,
          taskType: task.taskType,
        },
      });
      await prisma.lecipmExecutionTask.update({
        where: { id: task.id },
        data: { linkedActionPipelineId: pipeline.id },
      });
      return { actionPipelineId: pipeline.id, draftOnly: true, status: "READY_FOR_SIGNATURE" };
    }
    case "NOTARY_REMINDER": {
      const dealId = task.entityId;
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: { id: true, dealCode: true },
      });
      if (!deal) return { skipped: true, reason: "deal_not_found" };
      const pipeline = await createActionPipelineRecord({
        type: ActionPipelineType.CLOSING,
        dealId,
        aiGenerated: true,
        initialStatus: "READY_FOR_SIGNATURE",
        actorUserId: null,
        dataJson: {
          source: "lecipm_execution_task",
          taskId: task.id,
          kind: "NOTARY_REMINDER_PREP",
          dealCode: deal.dealCode,
        },
      });
      await prisma.lecipmExecutionTask.update({
        where: { id: task.id },
        data: { linkedActionPipelineId: pipeline.id },
      });
      return { actionPipelineId: pipeline.id, draftOnly: true, status: "READY_FOR_SIGNATURE" };
    }
    case "INVOICE_PREP": {
      const dealId =
        task.entityType === "DEAL" ? task.entityId : typeof payload.dealId === "string" ? payload.dealId : "";
      const pipeline = await createActionPipelineRecord({
        type: ActionPipelineType.FINANCE,
        dealId: dealId || null,
        aiGenerated: true,
        initialStatus: "READY_FOR_SIGNATURE",
        actorUserId: null,
        dataJson: {
          source: "lecipm_execution_task",
          taskId: task.id,
          lineItemsSuggestion: payload.lineItems ?? [{ description: "Services", quantity: 1, unitAmount: 0 }],
          note: "AI-prepared invoice structure — broker signature required before finance execution hooks.",
        },
      });
      await prisma.lecipmExecutionTask.update({
        where: { id: task.id },
        data: { linkedActionPipelineId: pipeline.id },
      });
      return {
        actionPipelineId: pipeline.id,
        draftOnly: true,
        status: "READY_FOR_SIGNATURE",
        lineItemsSuggestion: payload.lineItems ?? [{ description: "Services", quantity: 1, unitAmount: 0 }],
      };
    }
    case "PRICE_UPDATE_PREP": {
      return {
        draftOnly: true,
        listingId: task.entityType === "LISTING" ? task.entityId : String(payload.listingId ?? ""),
        proposedAdjustment: payload.proposedAdjustment ?? null,
        note: "Pricing change is advisory only — broker must apply in listing tools after review.",
      };
    }
    case "DEAL_STAGE_PREP": {
      return {
        draftOnly: true,
        suggestedStage: payload.suggestedStage ?? null,
        note: "Deal CRM stage is not mutated automatically — review and update manually.",
      };
    }
  }
  return { skipped: true, reason: "unhandled_task_type" };
}
