import { NextRequest, NextResponse } from "next/server";
import type { OfferStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { canTransitionOfferStatus } from "@/modules/offers/services/offer-status-machine";
import { resolveOfferActorRole } from "@/modules/offers/services/offer-access";
import { canViewOffer } from "@/modules/offers/services/offer-access";
import { notifyOfferEvent } from "@/modules/offers/services/offer-notifications";
import { sendSystemMessage } from "@/modules/messaging/services/send-system-message";
import { onOfferAccepted, onOfferRejected } from "@/modules/notifications/services/workflow-notification-triggers";
import { assertTrustDepositAllowsOfferAcceptance } from "@/lib/compliance/trust-offer-gate";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const STATUS_VALUES = new Set<string>([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "COUNTERED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
]);

function eventTypeForStatus(next: OfferStatus): "STATUS_CHANGED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" {
  if (next === "ACCEPTED") return "ACCEPTED";
  if (next === "REJECTED") return "REJECTED";
  if (next === "WITHDRAWN") return "WITHDRAWN";
  return "STATUS_CHANGED";
}

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
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { status?: string; message?: string };
  const nextRaw = body.status;
  if (!nextRaw || typeof nextRaw !== "string" || !STATUS_VALUES.has(nextRaw)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const next = nextRaw as OfferStatus;

  if (!canTransitionOfferStatus(offer.status, next, actor)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  if (next === "ACCEPTED") {
    const trustGate = await assertTrustDepositAllowsOfferAcceptance(id);
    if (!trustGate.ok) {
      return NextResponse.json({ error: trustGate.error }, { status: 400 });
    }
  }

  const msg =
    typeof body.message === "string" && body.message.length <= 4000 ? body.message : undefined;

  const evType = eventTypeForStatus(next);

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.offer.update({
      where: { id },
      data: { status: next },
    });
    await tx.offerEvent.create({
      data: {
        offerId: id,
        actorId: userId,
        type: evType,
        message: msg ?? (evType === "STATUS_CHANGED" ? `Status: ${next}` : undefined),
        metadata: { from: offer.status, to: next },
      },
    });
    return o;
  });

  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    const meta = { listingId: offer.listingId };
    if (next === "ACCEPTED") void trackDemoEvent(DemoEvents.OFFER_ACCEPTED, meta, userId);
    else if (next === "REJECTED") void trackDemoEvent(DemoEvents.OFFER_REJECTED, meta, userId);
    else if (next === "WITHDRAWN") void trackDemoEvent(DemoEvents.OFFER_WITHDRAWN, meta, userId);
  }

  if (next === "ACCEPTED") {
    notifyOfferEvent("offer_accepted", { offerId: id, listingId: offer.listingId, buyerId: offer.buyerId, brokerId: offer.brokerId });
    void onOfferAccepted({ offerId: id, buyerId: offer.buyerId, brokerId: offer.brokerId });
  } else if (next === "REJECTED") {
    notifyOfferEvent("offer_rejected", { offerId: id, listingId: offer.listingId, buyerId: offer.buyerId, brokerId: offer.brokerId });
    void onOfferRejected({ offerId: id, buyerId: offer.buyerId, brokerId: offer.brokerId });
  }

  try {
    const conv = await prisma.conversation.findFirst({
      where: { offerId: id },
      select: { id: true },
    });
    if (conv) {
      await sendSystemMessage(
        conv.id,
        `Offer status is now ${next.replace(/_/g, " ")}.`,
        { actorId: userId }
      );
    }
  } catch (e) {
    console.warn("[offer-status] conversation system message", e);
  }

  return NextResponse.json({ ok: true, offer: updated });
}
