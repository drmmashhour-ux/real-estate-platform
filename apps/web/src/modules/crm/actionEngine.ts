import { prisma } from "@/lib/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { assertBrokerCanReceiveNewLead, formatBrokerBillingBlockReason } from "@/modules/billing/brokerLeadBilling";
import { refreshLeadExecutionLayer } from "./leadExecutionRefresh";

/** Log operator intent to open messaging / Immo thread (deep links live in UI). */
export async function sendMessage(leadId: string, actorNote?: string): Promise<void> {
  await appendLeadTimelineEvent(leadId, "crm_action_send_message", {
    note: actorNote ?? "operator_queue_message",
  });
  await refreshLeadExecutionLayer(leadId);
}

export async function assignBroker(leadId: string, brokerUserId: string): Promise<void> {
  const gate = await assertBrokerCanReceiveNewLead(prisma, brokerUserId);
  if (!gate.ok) throw new Error(formatBrokerBillingBlockReason(gate.reason));
  await prisma.lead.update({
    where: { id: leadId },
    data: { introducedByBrokerId: brokerUserId },
  });
  await appendLeadTimelineEvent(leadId, "crm_action_assign_broker", { brokerUserId });
  await refreshLeadExecutionLayer(leadId);
}

export async function pushBooking(leadId: string, note?: string): Promise<void> {
  await appendLeadTimelineEvent(leadId, "crm_action_push_booking", { note: note ?? "nudge_checkout" });
  await refreshLeadExecutionLayer(leadId);
}

export async function markAsHot(leadId: string): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: { highIntent: true, aiTier: "hot", scoreLevel: "HOT" },
  });
  await appendLeadTimelineEvent(leadId, "crm_action_mark_hot", {});
  await refreshLeadExecutionLayer(leadId);
}

export async function markAsLost(leadId: string, reason?: string): Promise<void> {
  const now = new Date();
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lostAt: now,
      pipelineStatus: "lost",
      pipelineStage: "lost",
      executionStage: "lost",
      lostReason: reason ?? "crm_operator",
    },
  });
  await appendLeadTimelineEvent(leadId, "crm_action_mark_lost", { reason: reason ?? "crm_operator" });
}
