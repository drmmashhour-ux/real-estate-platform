import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import { brokerApproveCommitment, brokerRejectCommitment } from "@/modules/investment-flow/crm-deal-investment.service";

export const dynamic = "force-dynamic";

/**
 * POST — broker approves (CONFIRMED) or rejects SOFT_COMMIT. No auto-accept.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; commitmentId: string }> },
) {
  const { id: dealId, commitmentId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  let body: { approve?: boolean; reason?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  const isBrokerOnDeal = auth.deal.brokerId === auth.userId;
  const isAdmin = user?.role === "ADMIN";
  if (!isBrokerOnDeal && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (body.approve === true) {
      const row = await brokerApproveCommitment({
        deal: auth.deal,
        commitmentId,
        brokerUserId: auth.userId,
      });
      return NextResponse.json({ ok: true, commitment: { id: row.id, status: row.status } });
    }
    if (body.approve === false) {
      const row = await brokerRejectCommitment({
        deal: auth.deal,
        commitmentId,
        brokerUserId: auth.userId,
        reason: body.reason,
      });
      return NextResponse.json({ ok: true, commitment: { id: row.id, status: row.status } });
    }
    return NextResponse.json({ error: "approve boolean required" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    const status =
      msg === "COMMITMENT_NOT_FOUND" ? 404
      : msg === "BROKER_ONLY" || msg === "INVALID_COMMITMENT_STATE" ? 403
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
