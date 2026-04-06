import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { acceptOffer } from "@/lib/transactions/offers";
import { verifyTransactionParties } from "@/lib/transactions/verification";
import { prisma } from "@/lib/db";
import { autoRecordDealLegalActionFromOffer } from "@/lib/deals/legal-timeline-bridge";

/**
 * POST /api/offers/accept
 * Body: offer_id, accept_counter_offer_id? (when buyer accepts a counter)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const offerId = body.offer_id as string;
    const acceptCounterOfferId = body.accept_counter_offer_id as string | undefined;

    if (!offerId) {
      return Response.json({ error: "offer_id is required" }, { status: 400 });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: { listingId: true, buyerId: true, status: true },
    });
    if (!offer) {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    const result = await acceptOffer({
      offerId,
      acceptedById: userId,
      acceptCounterOfferId: acceptCounterOfferId ?? null,
    });
    void autoRecordDealLegalActionFromOffer({
      listingId: offer.listingId,
      buyerId: offer.buyerId,
      actorUserId: userId,
      action: "OFFER_ACCEPTED",
      note:
        offer.status === "COUNTERED"
          ? "Counter-offer accepted automatically from offer workflow."
          : "Offer accepted automatically from offer workflow.",
    });

    const verification = await verifyTransactionParties(result.transactionId);
    if (!verification.ok) {
      return Response.json({
        transaction_id: result.transactionId,
        status: result.status,
        verification_warnings: verification.errors,
      });
    }

    return Response.json({
      transaction_id: result.transactionId,
      status: result.status,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Accept offer failed" },
      { status: 500 }
    );
  }
}
