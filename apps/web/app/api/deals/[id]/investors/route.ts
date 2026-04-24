import { NextResponse } from "next/server";
import { authenticateDealParticipantRoute } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET — investor commitments / subscriptions / payments for deal dashboard.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateDealParticipantRoute(dealId);
  if (!auth.ok) return auth.response;

  const rows = await prisma.crmDealInvestorCommitment.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { payments: true } },
    },
  });

  const investors = rows.map((c) => {
    let lifecycle: string = c.status;
    if (c.status === "CONFIRMED") {
      if (!c.subscription?.signed) lifecycle = "AWAITING_SIGNATURE";
      else if (c.subscription.payments.some((p) => p.received)) lifecycle = "FUNDED";
      else lifecycle = "AWAITING_FUNDS";
    }
    return {
      commitmentId: c.id,
      investorId: c.investorId,
      committedAmountCents: c.committedAmountCents,
      currency: c.currency,
      status: c.status,
      spvId: c.spvId,
      subscription: c.subscription ?
        {
          id: c.subscription.id,
          subscriptionAmountCents: c.subscription.subscriptionAmountCents,
          signed: c.subscription.signed,
          signedAt: c.subscription.signedAt?.toISOString() ?? null,
          documentId: c.subscription.documentId,
          payments: c.subscription.payments.map((p) => ({
            id: p.id,
            amountCents: p.amountCents,
            method: p.method,
            received: p.received,
            receivedAt: p.receivedAt?.toISOString() ?? null,
            referenceNumber: p.referenceNumber,
          })),
        }
      : null,
      lifecycle,
    };
  });

  return NextResponse.json({ ok: true, dealId, investors });
}
