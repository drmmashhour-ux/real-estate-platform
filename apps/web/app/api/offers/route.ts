import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { assertListingExists } from "@/modules/offers/services/listing-exists";
import {
  OFFER_MAX_CONDITIONS,
  OFFER_MAX_MESSAGE,
  parseOptionalClosingDate,
  parseOptionalString,
  parseOfferedPrice,
  parseScenario,
} from "@/modules/offers/services/offer-validation";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";
import { notifyOfferEvent } from "@/modules/offers/services/offer-notifications";
import { assertBuyerOfferAllowed } from "@/modules/legal/assert-legal";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";

export const dynamic = "force-dynamic";

/**
 * POST /api/offers — submit a new offer (status SUBMITTED).
 * Does not accept brokerId from client (set later or via admin).
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const listingCheck = await assertListingExists(listingId);
  if (!listingCheck.ok) {
    return NextResponse.json({ error: listingCheck.error }, { status: listingCheck.status });
  }

  if (!legalEnforcementDisabled()) {
    const legal = await assertBuyerOfferAllowed(userId, listingId);
    if (!legal.ok) {
      return NextResponse.json(
        {
          error: legal.blockingReasons[0] ?? "Complete required legal acknowledgments before submitting an offer.",
          code: "LEGAL_FORMS_REQUIRED",
          missing: legal.missing.map((m) => m.key),
        },
        { status: 403 }
      );
    }
  }

  if (enforceableContractsRequired()) {
    const signed = await hasActiveEnforceableContract(userId, ENFORCEABLE_CONTRACT_TYPES.BUYER, { listingId });
    if (!signed) {
      return NextResponse.json(
        {
          error:
            "Sign the buyer agreement for this listing before submitting an offer (legal → ContractSign with kind=buyer and listing id).",
          code: "ENFORCEABLE_CONTRACT_REQUIRED",
        },
        { status: 403 }
      );
    }
  }

  const price = parseOfferedPrice(body.offeredPrice);
  if (!price.ok) return NextResponse.json({ error: price.error }, { status: 400 });

  let down: number | null | undefined;
  if (body.downPaymentAmount != null && body.downPaymentAmount !== "") {
    const d = typeof body.downPaymentAmount === "number" ? body.downPaymentAmount : parseFloat(String(body.downPaymentAmount));
    if (!Number.isFinite(d) || d < 0) return NextResponse.json({ error: "downPaymentAmount is invalid" }, { status: 400 });
    down = d;
  }

  let financing: boolean | null | undefined;
  if (body.financingNeeded === true || body.financingNeeded === false) financing = body.financingNeeded;
  if (body.financingNeeded === "yes") financing = true;
  if (body.financingNeeded === "no") financing = false;

  const closing = await parseOptionalClosingDate(body.closingDate);
  if (!closing.ok) return NextResponse.json({ error: closing.error }, { status: 400 });

  const cond = parseOptionalString(body.conditions, OFFER_MAX_CONDITIONS, "conditions");
  if (!cond.ok) return NextResponse.json({ error: cond.error }, { status: 400 });
  const msg = parseOptionalString(body.message, OFFER_MAX_MESSAGE, "message");
  if (!msg.ok) return NextResponse.json({ error: msg.error }, { status: 400 });

  const scenario = parseScenario(body.scenario);

  const data: Prisma.OfferCreateInput = {
    listingId,
    buyer: { connect: { id: userId } },
    status: "SUBMITTED",
    offeredPrice: price.value,
    downPaymentAmount: down ?? null,
    financingNeeded: financing ?? null,
    closingDate: closing.value,
    conditions: cond.value,
    message: msg.value,
    ...(scenario !== undefined ? { scenario } : {}),
  };

  const offer = await prisma.$transaction(async (tx) => {
    const o = await tx.offer.create({ data });
    await tx.offerEvent.create({
      data: {
        offerId: o.id,
        actorId: userId,
        type: "CREATED",
        message: "Offer created",
        metadata: { submitted: true },
      },
    });
    await tx.offerEvent.create({
      data: {
        offerId: o.id,
        actorId: userId,
        type: "SUBMITTED",
        message: msg.value ?? "Offer submitted",
      },
    });
    return o;
  });

  void trackDemoEvent(
    DemoEvents.OFFER_SUBMITTED,
    { listingId: offer.listingId, offeredPrice: offer.offeredPrice },
    userId
  );
  void recordAnalyticsFunnelEvent({
    name: "deal_started",
    listingId: offer.listingId,
    userId,
    source: "offer_submitted",
    metadata: { offerId: offer.id },
  });
  notifyOfferEvent("offer_submitted", {
    offerId: offer.id,
    listingId: offer.listingId,
    buyerId: userId,
  });

  return NextResponse.json({ ok: true, offer });
}
