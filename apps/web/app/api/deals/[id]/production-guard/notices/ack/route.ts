import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import { recordCriticalNoticeAcknowledgment } from "@/lib/production-guard/notice-ack.service";
import { recordProductionGuardAudit } from "@/lib/production-guard/audit-service";

export const dynamic = "force-dynamic";

/**
 * POST — record explicit critical-notice acknowledgment (checkbox + server timestamp).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let noticeId: string | undefined;
  try {
    const body = (await request.json()) as { noticeId?: string };
    noticeId = typeof body.noticeId === "string" ? body.noticeId.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!noticeId) {
    return NextResponse.json({ error: "noticeId required" }, { status: 400 });
  }

  const res = await recordCriticalNoticeAcknowledgment({
    dealId,
    userId: auth.userId,
    noticeId,
  });
  if (!res.ok) {
    await recordProductionGuardAudit({
      dealId,
      actorUserId: auth.userId,
      action: "form_schema_rejected",
      entityType: "critical_notice",
      entityId: noticeId,
      metadata: { reason: res.error },
    });
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, noticeId, dealId });
}
