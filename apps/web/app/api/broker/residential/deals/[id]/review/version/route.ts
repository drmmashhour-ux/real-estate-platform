import { NextRequest } from "next/server";
import type { DealDocumentVersionSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { recordDocumentVersion } from "@/modules/review/versioning.service";

export const dynamic = "force-dynamic";

/**
 * Records an explicit broker review version checkpoint on a deal document (audit trail).
 * Does not mutate official PDFs — structured snapshot only.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId } = await context.params;

  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || !canMutateExecution(session.userId, user.role, deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { dealDocumentId?: string; changesSummary?: Record<string, unknown>; source?: DealDocumentVersionSource };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.dealDocumentId || typeof body.dealDocumentId !== "string") {
    return Response.json({ error: "dealDocumentId required" }, { status: 400 });
  }

  const doc = await prisma.dealDocument.findFirst({
    where: { id: body.dealDocumentId, dealId },
  });
  if (!doc) return Response.json({ error: "Document not found" }, { status: 404 });

  const source = body.source ?? "broker_edit";
  const version = await recordDocumentVersion({
    dealDocumentId: doc.id,
    source,
    changesSummary: body.changesSummary ?? { note: "broker_review_checkpoint" },
    createdById: session.userId,
  });

  void logDealExecutionEvent({
    eventType: "review_completed",
    userId: session.userId,
    dealId,
    metadata: { dealDocumentId: doc.id, versionNumber: version.versionNumber },
  });

  return Response.json({ ok: true, version });
}
