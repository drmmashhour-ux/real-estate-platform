import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { notifyOfferEvent } from "@/modules/offers/services/offer-notifications";
import { onOfferSubmitted } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/offers/[id]/submit — buyer submits a draft. */
export async function POST(_request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.buyerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (offer.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft offers can be submitted" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.offer.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });
    await tx.offerEvent.create({
      data: {
        offerId: id,
        actorId: userId,
        type: "SUBMITTED",
        message: offer.message ?? "Offer submitted",
      },
    });
    return o;
  });

  void trackDemoEvent(
    DemoEvents.OFFER_SUBMITTED,
    { listingId: updated.listingId, offeredPrice: updated.offeredPrice },
    userId
  );
  notifyOfferEvent("offer_submitted", {
    offerId: updated.id,
    listingId: updated.listingId,
    buyerId: userId,
  });
  void onOfferSubmitted({
    offerId: updated.id,
    listingId: updated.listingId,
    buyerId: userId,
    brokerId: updated.brokerId,
  });

  return NextResponse.json({ ok: true, offer: updated });
}
