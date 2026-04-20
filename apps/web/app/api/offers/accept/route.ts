import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { ERR_COOWNERSHIP_ACCEPT_OFFER } from "@/services/compliance/coownershipCompliance.service";
import { acceptOffer } from "@/lib/transactions/offers";
import { verifyTransactionParties } from "@/lib/transactions/verification";
import { prisma } from "@/lib/db";
import { autoRecordDealLegalActionFromOffer } from "@/lib/deals/legal-timeline-bridge";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";

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
      select: { listingId: true, buyerId: true, brokerId: true, status: true },
    });
    if (!offer) {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    const actorType =
      offer.buyerId === userId ? "buyer" : offer.brokerId === userId ? "broker" : "seller";
    const phase3Gate = await maybeBlockRequestWithLegalGate({
      action: "accept_offer",
      userId,
      actorType,
    });
    if (phase3Gate) return phase3Gate;

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
    const msg = e instanceof Error ? e.message : "Accept offer failed";
    if (msg === ERR_COOWNERSHIP_ACCEPT_OFFER) {
      return Response.json({ error: msg }, { status: 403 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
