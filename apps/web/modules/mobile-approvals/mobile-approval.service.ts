import { prisma } from "@/lib/db";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import type { MobileApprovalResult } from "./mobile-approvals.types";

/**
 * Completes a **safe** mobile action — never sends external legal notices or negotiation emails.
 */
export async function completeMobileBrokerAction(input: {
  brokerUserId: string;
  isAdmin: boolean;
  actionId: string;
}): Promise<MobileApprovalResult> {
  const segments = input.actionId.split(":").filter(Boolean);
  if (segments[0] !== "dac") {
    return { ok: false, error: "Unknown action namespace" };
  }

  if (segments[1] === "task" && segments[2]) {
    const id = segments[2];
    const task = await prisma.lecipmBrokerTask.findFirst({
      where: { id, brokerId: input.brokerUserId },
    });
    if (!task) return { ok: false, error: "Task not found" };
    await prisma.lecipmBrokerTask.update({
      where: { id },
      data: { status: "done" },
    });
    return { ok: true, kind: "broker_task_complete", entityId: id };
  }

  if (segments[1] === "draft" && segments[2]) {
    const id = segments[2];
    const draft = await prisma.lecipmCommunicationDraft.findFirst({
      where: { id, brokerId: input.brokerUserId, status: "pending_approval" },
    });
    if (!draft) return { ok: false, error: "Draft not found or not awaiting approval" };
    await prisma.lecipmCommunicationDraft.update({
      where: { id },
      data: { status: "approved" },
    });
    return { ok: true, kind: "communication_draft_approve", entityId: id };
  }

  if (segments[1] === "deal" && segments[3] === "neg" && segments[2] && segments[4]) {
    const dealId = segments[2];
    const sugId = segments[4];
    const deal = await requireBrokerDealAccess(input.brokerUserId, dealId, input.isAdmin);
    if (!deal) return { ok: false, error: "Deal not found" };
    const sug = await prisma.negotiationSuggestion.findFirst({
      where: { id: sugId, dealId, status: "pending_review" },
    });
    if (!sug) return { ok: false, error: "Suggestion not found" };
    await prisma.negotiationSuggestion.update({
      where: { id: sugId },
      data: { status: "approved" },
    });
    return { ok: true, kind: "negotiation_suggestion_approve", entityId: sugId };
  }

  if (segments[1] === "deal" && segments[3] === "item" && segments[2] && segments[4]) {
    const dealId = segments[2];
    const itemId = segments[4];
    const deal = await requireBrokerDealAccess(input.brokerUserId, dealId, input.isAdmin);
    if (!deal) return { ok: false, error: "Deal not found" };
    const item = await prisma.dealRequestItem.findFirst({
      where: { id: itemId, dealRequest: { dealId } },
    });
    if (!item) return { ok: false, error: "Item not found" };
    await prisma.dealRequestItem.update({
      where: { id: itemId },
      data: {
        status: "RECEIVED",
        receivedAt: new Date(),
      },
    });
    return { ok: true, kind: "deal_request_item_received", entityId: itemId };
  }

  return { ok: false, error: "Action type not completable from mobile in v1" };
}

export async function snoozeMobileAction(input: {
  userId: string;
  actionId: string;
  until: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.brokerMobilePreferences.findUnique({
    where: { userId: input.userId },
    select: { snoozedActionsJson: true },
  });
  const prev = (row?.snoozedActionsJson as { id: string; until: string }[]) ?? [];
  const next = [...prev.filter((s) => s.id !== input.actionId), { id: input.actionId, until: input.until.toISOString() }];
  await prisma.brokerMobilePreferences.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      snoozedActionsJson: next as object,
    },
    update: { snoozedActionsJson: next as object },
  });
  return { ok: true };
}
