import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { getLatestOfferDraftForDeal } from "@/modules/offer-draft/offer-draft.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  const draft = await getLatestOfferDraftForDeal(dealId);
  if (!draft) {
    return NextResponse.json({ ok: true, offerAi: true, draft: null });
  }

  return NextResponse.json({
    ok: true,
    offerAi: true,
    draft: {
      id: draft.id,
      status: draft.status,
      purchasePrice: draft.purchasePrice,
      depositAmount: draft.depositAmount,
      financingDeadline: draft.financingDeadline?.toISOString() ?? null,
      inspectionDeadline: draft.inspectionDeadline?.toISOString() ?? null,
      occupancyDate: draft.occupancyDate?.toISOString() ?? null,
      includedItemsJson: draft.includedItemsJson,
      excludedItemsJson: draft.excludedItemsJson,
      specialConditionsJson: draft.specialConditionsJson,
      rationaleJson: draft.rationaleJson,
      priceBandsJson: draft.priceBandsJson,
      clauseWarningsJson: draft.clauseWarningsJson,
      financingClauseText: draft.financingClauseText,
      inspectionClauseText: draft.inspectionClauseText,
      occupancyClauseText: draft.occupancyClauseText,
      promiseArtifactId: draft.promiseArtifactId,
      approvedAt: draft.approvedAt?.toISOString() ?? null,
      sentAt: draft.sentAt?.toISOString() ?? null,
    },
  });
}
