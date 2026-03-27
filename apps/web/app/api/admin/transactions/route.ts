import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/transactions
 * Query: status?, frozen?, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const frozen = searchParams.get("frozen");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const offset = Number(searchParams.get("offset")) || 0;

    const where: { status?: string; frozenByAdmin?: boolean } = {};
    if (status) where.status = status;
    if (frozen === "true") where.frozenByAdmin = true;
    if (frozen === "false") where.frozenByAdmin = false;

    const transactions = await prisma.realEstateTransaction.findMany({
      where,
      include: {
        propertyIdentity: { select: { id: true, propertyUid: true, officialAddress: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
        _count: { select: { deposits: true, documents: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    return Response.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        property_identity: t.propertyIdentity,
        buyer: t.buyer,
        seller: t.seller,
        broker: t.broker,
        offer_price: t.offerPrice,
        status: t.status,
        frozen_by_admin: t.frozenByAdmin,
        deposit_count: t._count.deposits,
        document_count: t._count.documents,
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
