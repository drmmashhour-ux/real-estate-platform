import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { generateOfferDraftRecord } from "@/modules/offer-draft/offer-draft.service";

export const dynamic = "force-dynamic";

/** POST — AI assistive draft only; broker must review before any send. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  try {
    const draft = await generateOfferDraftRecord({ dealId, actorBrokerUserId: auth.userId });
    return NextResponse.json({ ok: true, offerAi: true, draft: { id: draft.id, status: draft.status } });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? "GENERATE_FAILED" }, { status: 400 });
  }
}
