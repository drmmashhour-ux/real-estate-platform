import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { getConversionOfferForCrmLead } from "@/modules/brokers/broker-conversion.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET — pricing, quality copy, unlock eligibility for CRM lead detail (value before pay). */
export async function GET(_request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: crmLeadId } = await context.params;
  if (!crmLeadId?.trim()) return NextResponse.json({ error: "Invalid lead" }, { status: 400 });

  const row = await findLeadForBrokerScope(crmLeadId, auth.user.id, auth.user.role);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const offer = await getConversionOfferForCrmLead(crmLeadId, auth.user.id);
  if (!offer.ok) {
    return NextResponse.json({
      ok: false,
      reason: offer.reason,
      message: offer.message,
      crmLeadId,
    });
  }

  return NextResponse.json({
    ok: true,
    crmLeadId,
    marketplaceLeadId: offer.marketplaceLeadId,
    listPriceCents: offer.listPriceCents,
    offerPriceCents: offer.offerPriceCents,
    firstLeadEligible: offer.firstLeadEligible,
    firstLeadOfferApplied: offer.firstLeadOfferApplied,
    unlocked: offer.unlocked,
    quality: offer.quality,
    copy: {
      tryLine: "This lead is available — unlock to view full contact details and move faster.",
      coach: "No pressure — unlock when you are ready to work this opportunity.",
    },
  });
}
