import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { submitOffer } from "@/lib/transactions/offers";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";

/**
 * POST /api/offers/submit
 * Body: transaction_id, offer_price (cents), conditions?, expiration_date? (ISO)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const transactionId = body.transaction_id as string;
    const offerPrice = Number(body.offer_price);
    const expirationDate = body.expiration_date ? new Date(body.expiration_date) : null;

    if (!transactionId || Number.isNaN(offerPrice) || offerPrice <= 0) {
      return Response.json(
        { error: "transaction_id and offer_price (positive number) are required" },
        { status: 400 }
      );
    }

    const actionPipelineId =
      typeof body.action_pipeline_id === "string" && body.action_pipeline_id.trim()
        ? body.action_pipeline_id.trim()
        : null;

    const result = await submitOffer({
      transactionId,
      buyerId: userId,
      offerPrice,
      conditions: body.conditions ?? undefined,
      expirationDate,
      actionPipelineId,
    });

    if (process.env.NEXT_PUBLIC_ENV === "staging") {
      const txRow = await prisma.realEstateTransaction.findUnique({
        where: { id: transactionId },
        select: { listingId: true },
      });
      void trackDemoEvent(
        DemoEvents.CREATE_OFFER,
        { listingId: txRow?.listingId ?? null, amount: offerPrice },
        userId
      );
    }

    return Response.json({
      offer_id: result.offerId,
      status: result.status,
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Submit offer failed";
    if (msg.includes("Mandatory broker disclosure")) {
      return Response.json(
        { error: msg, code: "BROKER_MANDATORY_DISCLOSURE_REQUIRED" },
        { status: 403 }
      );
    }
    if (msg.includes("OACIQ client disclosure")) {
      return Response.json(
        { error: msg, code: "OACIQ_CLIENT_DISCLOSURE_REQUIRED" },
        { status: 403 }
      );
    }
    if (msg.includes("responsible broker") || msg.includes("BrokerDecisionAuthority")) {
      return Response.json(
        { error: msg, code: "BROKER_DECISION_AUTHORITY_REQUIRED" },
        { status: 403 }
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
