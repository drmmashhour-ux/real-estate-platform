import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import { brokerRecordSubscriptionSigned } from "@/modules/investment-flow/crm-deal-investment.service";

export const dynamic = "force-dynamic";

/**
 * POST — broker attests subscription agreement signed (no automatic signature).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (auth.deal.brokerId !== auth.userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { commitmentId?: string; documentId?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const commitmentId = typeof body.commitmentId === "string" ? body.commitmentId.trim() : "";
  if (!commitmentId) {
    return NextResponse.json({ error: "commitmentId required" }, { status: 400 });
  }

  try {
    const sub = await brokerRecordSubscriptionSigned({
      dealId,
      commitmentId,
      brokerUserId: auth.userId,
      documentId: typeof body.documentId === "string" ? body.documentId.trim() : null,
    });
    return NextResponse.json({
      ok: true,
      subscription: {
        id: sub.id,
        signed: sub.signed,
        signedAt: sub.signedAt?.toISOString() ?? null,
        documentId: sub.documentId,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    const status =
      msg === "SUBSCRIPTION_NOT_READY" || msg === "DOCUMENT_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
