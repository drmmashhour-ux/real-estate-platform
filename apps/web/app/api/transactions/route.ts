import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/transactions
 * Query: role=buyer|seller|broker (default: all for current user)
 * Returns transactions where the user is buyer, seller, or broker.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const where =
      role === "buyer"
        ? { buyerId: userId }
        : role === "seller"
          ? { sellerId: userId }
          : role === "broker"
            ? { brokerId: userId }
            : {
                OR: [
                  { buyerId: userId },
                  { sellerId: userId },
                  { brokerId: userId },
                ],
              };

    const transactions = await prisma.realEstateTransaction.findMany({
      where,
      include: {
        propertyIdentity: { select: { id: true, propertyUid: true, officialAddress: true, municipality: true, province: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return Response.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        property_identity: t.propertyIdentity,
        listing_id: t.listingId,
        buyer: t.buyer,
        seller: t.seller,
        broker: t.broker,
        offer_price: t.offerPrice,
        status: t.status,
        frozen_by_admin: t.frozenByAdmin,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to list transactions" },
      { status: 500 }
    );
  }
}
