import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateExecution, loadDealWithActor } from "@/lib/deals/execution-access";
import { dealExecutionFlags } from "@/config/feature-flags";
import { prisma } from "@repo/db";
import { brokerApproveDocument } from "@/modules/review/broker-review.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });

  const logs = await prisma.dealExecutionAuditLog.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: { id: true, actionKey: true, payload: true, createdAt: true, actorUserId: true },
  });
  return Response.json({ auditLogs: logs, brokerReviewWorkflowEnabled: dealExecutionFlags.brokerReviewWorkflowV1 });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canMutateExecution(userId, user.role, deal)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!dealExecutionFlags.brokerReviewWorkflowV1) {
    return Response.json({ error: "Broker review workflow disabled" }, { status: 403 });
  }

  let body: { dealDocumentId?: string; nextStatus?: "approved" | "broker_review" | "exported" };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const dealDocumentId = typeof body.dealDocumentId === "string" ? body.dealDocumentId : "";
  const nextStatus = body.nextStatus ?? "approved";
  if (!dealDocumentId || !["approved", "broker_review", "exported"].includes(nextStatus)) {
    return Response.json({ error: "dealDocumentId and valid nextStatus required" }, { status: 400 });
  }

  const doc = await prisma.dealDocument.findFirst({ where: { id: dealDocumentId, dealId } });
  if (!doc) return Response.json({ error: "Document not found" }, { status: 404 });

  await brokerApproveDocument({
    dealDocumentId,
    dealId,
    actorUserId: userId,
    nextStatus,
  });
  return Response.json({ ok: true });
}
