import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { authenticateDealParticipantRoute } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";
import { createSoftCommit } from "@/modules/investment-flow/crm-deal-investment.service";

export const dynamic = "force-dynamic";

/**
 * POST — investor (buyer) or broker creates SOFT_COMMIT (explicit amount only; never auto).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;

  let body: {
    committedAmountCents?: number;
    spvId?: string | null;
    investorId?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = body.committedAmountCents;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "committedAmountCents required" }, { status: 400 });
  }

  const brokerAuth = await authenticateBrokerDealRoute(dealId);
  const participantAuth = await authenticateDealParticipantRoute(dealId);

  let investorId: string;
  let actorUserId: string;

  if (body.investorId && body.investorId.trim()) {
    if (!brokerAuth.ok) {
      return NextResponse.json({ error: "Broker access required to commit on behalf" }, { status: 403 });
    }
    const brokerUser = await prisma.user.findUnique({
      where: { id: brokerAuth.userId },
      select: { role: true },
    });
    if (brokerAuth.deal.brokerId !== brokerAuth.userId && brokerUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    investorId = body.investorId.trim();
    actorUserId = brokerAuth.userId;
  } else {
    if (!participantAuth.ok) return participantAuth.response;
    if (participantAuth.deal.buyerId !== participantAuth.userId) {
      return NextResponse.json({ error: "Only the deal buyer may self-commit" }, { status: 403 });
    }
    investorId = participantAuth.userId;
    actorUserId = participantAuth.userId;
  }

  try {
    const row = await createSoftCommit({
      dealId,
      investorId,
      committedAmountCents: Math.floor(amount),
      spvId: typeof body.spvId === "string" && body.spvId.trim() ? body.spvId.trim() : null,
      actorUserId,
    });
    return NextResponse.json({
      ok: true,
      commitment: {
        id: row.id,
        status: row.status,
        committedAmountCents: row.committedAmountCents,
        currency: row.currency,
        spvId: row.spvId,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    if (msg === "SPV_NOT_FOUND") return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
