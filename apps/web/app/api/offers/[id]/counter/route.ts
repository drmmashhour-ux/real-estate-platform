import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { canPostCounterOffer } from "@/modules/offers/services/offer-status-machine";
import { resolveOfferActorRole } from "@/modules/offers/services/offer-access";
import { canViewOffer } from "@/modules/offers/services/offer-access";
import {
  OFFER_MAX_CONDITIONS,
  OFFER_MAX_MESSAGE,
  parseOptionalClosingDate,
  parseOptionalString,
  parseOfferedPrice,
} from "@/modules/offers/services/offer-validation";
import { notifyOfferEvent } from "@/modules/offers/services/offer-notifications";
import { onOfferCountered } from "@/modules/notifications/services/workflow-notification-triggers";
import { autoRecordDealLegalActionFromOffer } from "@/lib/deals/legal-timeline-bridge";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  if (!canViewOffer({ userId, role: user.role, offer })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const actor = resolveOfferActorRole({ userId, role: user.role, offer });
  if (!actor || !canPostCounterOffer(offer.status, actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const price = parseOfferedPrice(body.offeredPrice);
  if (!price.ok) return NextResponse.json({ error: price.error }, { status: 400 });

  const closing = await parseOptionalClosingDate(body.closingDate);
  if (!closing.ok) return NextResponse.json({ error: closing.error }, { status: 400 });

  const cond = parseOptionalString(body.conditions, OFFER_MAX_CONDITIONS, "conditions");
  if (!cond.ok) return NextResponse.json({ error: cond.error }, { status: 400 });
  const msg = parseOptionalString(body.message, OFFER_MAX_MESSAGE, "message");
  if (!msg.ok) return NextResponse.json({ error: msg.error }, { status: 400 });

  const previousPrice = offer.offeredPrice;

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.offer.update({
      where: { id },
      data: {
        status: "COUNTERED",
        offeredPrice: price.value,
        closingDate: closing.value ?? offer.closingDate,
        conditions: cond.value ?? offer.conditions,
        brokerId: offer.brokerId ?? userId,
      },
    });
    await tx.offerEvent.create({
      data: {
        offerId: id,
        actorId: userId,
        type: "COUNTERED",
        message: msg.value ?? "Counter-offer issued",
        metadata: {
          previousPrice,
          counterPrice: price.value,
          closingDate: closing.value?.toISOString() ?? null,
        },
      },
    });
    return o;
  });

  void trackDemoEvent(DemoEvents.OFFER_COUNTERED, { listingId: offer.listingId }, userId);
  notifyOfferEvent("offer_countered", {
    offerId: id,
    listingId: offer.listingId,
    buyerId: offer.buyerId,
    brokerId: updated.brokerId,
  });
  void onOfferCountered({
    offerId: id,
    listingId: offer.listingId,
    buyerId: offer.buyerId,
    brokerId: updated.brokerId,
  });
  void autoRecordDealLegalActionFromOffer({
    listingId: offer.listingId,
    buyerId: offer.buyerId,
    actorUserId: userId,
    action: "COUNTER_PROPOSAL_SENT",
    note: msg.value ?? "Counter-offer recorded automatically from offer workflow.",
  });

  return NextResponse.json({ ok: true, offer: updated });
}
