import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { resolveMarketplaceLeadForCrmLead } from "@/modules/brokers/broker-conversion.service";
import { initiateLeadUnlockCheckout } from "@/modules/leads/lead-monetization.service";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";
import { logError } from "@/lib/logger";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * POST — start Stripe checkout to unlock platform contact for the inquiry linked to this CRM lead.
 * Reuses `lead_unlock` (same as `/api/lecipm/leads/[marketplaceLeadId]/unlock-checkout`).
 */
export async function POST(_request: Request, context: Params) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: crmLeadId } = await context.params;
  if (!crmLeadId?.trim()) return NextResponse.json({ error: "Invalid lead" }, { status: 400 });

  const row = await findLeadForBrokerScope(crmLeadId, auth.user.id, auth.user.role);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const legalGate = await maybeBlockRequestWithLegalGate({
    action: "unlock_contact",
    userId: auth.user.id,
    actorType: "broker",
  });
  if (legalGate) return legalGate;

  try {
    const marketplaceLeadId = await resolveMarketplaceLeadForCrmLead(crmLeadId);
    if (!marketplaceLeadId) {
      return NextResponse.json(
        {
          error: "no_marketplace_link",
          message:
            "This inquiry is not linked to a paid-unlock record yet. When the visitor matches a listing inquiry, unlock becomes available.",
        },
        { status: 422 },
      );
    }

    const result = await initiateLeadUnlockCheckout({
      userId: auth.user.id,
      leadId: marketplaceLeadId,
      crmLeadId,
      recordMonetizationAttempt: false,
    });

    if (!result.ok) {
      if (result.softBlock) {
        return NextResponse.json({
          softBlock: true,
          message: result.message,
          cta: "Unlock Lead",
          reason: result.reason ?? "not_paid",
        });
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      url: result.url,
      sessionId: result.sessionId,
      amountCents: result.amountCents,
      marketplaceLeadId,
    });
  } catch (e) {
    logError("broker_crm_unlock_checkout_failed", { crmLeadId, err: e });
    return NextResponse.json({ error: "Checkout unavailable" }, { status: 502 });
  }
}
