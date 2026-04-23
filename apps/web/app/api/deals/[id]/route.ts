/**
 * GET /api/deals/[id] – Get deal by id.
 * PATCH /api/deals/[id] – Update deal status (and milestones).
 */

import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { recordDealCrmStageChange } from "@/lib/ai/automation-triggers";
import { hintCrmStageFromDealStatus } from "@/lib/ai/lifecycle/deal-actions";
import { notifyDealClosedCelebrationIfNeeded } from "@/lib/listing-lifecycle/notify-deal-closed-celebration";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;

  const deal = await prisma.deal.findFirst({
    where: {
      id,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
      milestones: true,
      documents: true,
      payments: true,
    },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(deal);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;

  const deal = await prisma.deal.findFirst({
    where: {
      id,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const canUpdate = user?.role === "BROKER" || user?.role === "ADMIN" || userId === deal.brokerId;
  if (!canUpdate) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : undefined;
  const crmStageRaw = typeof body.crmStage === "string" ? body.crmStage : undefined;
  const CRM_STAGES = new Set([
    "new",
    "contacted",
    "visit_scheduled",
    "offer_made",
    "negotiation",
    "accepted",
    "closed",
    "lost",
  ]);

  const data: Record<string, unknown> = {};
  if (status && ["initiated", "offer_submitted", "accepted", "inspection", "financing", "closing_scheduled", "closed", "cancelled"].includes(status)) {
    data.status = status;
    const hint = hintCrmStageFromDealStatus(status);
    if (hint && !crmStageRaw) {
      data.crmStage = hint;
    }
  }
  if (crmStageRaw && CRM_STAGES.has(crmStageRaw)) {
    data.crmStage = crmStageRaw;
  }

  if (Object.keys(data).length === 0) {
    return Response.json(deal);
  }

  const prevCrm = deal.crmStage ?? null;
  const prevStatus = deal.status;
  const updated = await prisma.deal.update({
    where: { id },
    data,
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
      milestones: true,
      documents: true,
      payments: true,
    },
  });

  if (updated.status === "closed" && prevStatus !== "closed") {
    void notifyDealClosedCelebrationIfNeeded(id).catch(() => {});
  }

  const newCrm = updated.crmStage ?? null;
  if (newCrm !== prevCrm && userId) {
    await prisma.crmInteraction
      .create({
        data: {
          dealId: id,
          brokerId: userId,
          type: "stage_change",
          body: `Deal CRM stage: ${prevCrm ?? "unset"} → ${newCrm ?? "unset"}. Legal status: ${updated.status}`,
          metadata: { status: updated.status },
        },
      })
      .catch(() => {});
    await recordDealCrmStageChange({
      brokerId: updated.brokerId,
      dealId: id,
      fromStage: prevCrm,
      toStage: newCrm ?? updated.status,
    }).catch(() => {});
  }

  return Response.json(updated);
}
