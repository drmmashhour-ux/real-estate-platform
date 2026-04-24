import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { recordProductionGuardAudit } from "@/lib/production-guard/audit-service";
import { isCriticalNoticeId } from "@/lib/production-guard/critical-notices";

export const dynamic = "force-dynamic";

/**
 * POST — audit trail when a critical notice is presented to the user (read/shown event).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  let noticeId: string | undefined;
  try {
    const body = (await request.json()) as { noticeId?: string };
    noticeId = typeof body.noticeId === "string" ? body.noticeId.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!noticeId || !isCriticalNoticeId(noticeId)) {
    return NextResponse.json({ error: "Invalid noticeId" }, { status: 400 });
  }

  await recordProductionGuardAudit({
    dealId,
    actorUserId: auth.userId,
    action: "notice_shown",
    entityType: "critical_notice",
    entityId: noticeId,
    metadata: { noticeId },
  });

  return NextResponse.json({ ok: true });
}
