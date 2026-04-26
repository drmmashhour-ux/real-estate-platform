import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createTransaction } from "@/lib/transactions/create";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * POST /api/transactions/create
 * Body: property_identity_id, listing_id?, seller_id, broker_id?
 * Creates a transaction; caller is the buyer.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const propertyIdentityId = body.property_identity_id as string;
    const listingId = body.listing_id as string | undefined;
    const sellerId = body.seller_id as string;
    const brokerId = body.broker_id as string | undefined;

    if (!propertyIdentityId || !sellerId) {
      return Response.json(
        { error: "property_identity_id and seller_id are required" },
        { status: 400 }
      );
    }

    const identity = await prisma.propertyIdentity.findUnique({
      where: { id: propertyIdentityId },
      select: { id: true },
    });
    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    const result = await createTransaction({
      propertyIdentityId,
      listingId: listingId ?? null,
      buyerId: userId,
      sellerId,
      brokerId: brokerId ?? null,
    });

    return Response.json({
      transaction_id: result.id,
      status: result.status,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 }
    );
  }
}
