import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/transactions/:id
 * Full transaction detail for buyer, seller, or broker.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id },
      include: {
        propertyIdentity: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
        offers: { include: { counterOffers: true } },
        messages: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        deposits: true,
        documents: true,
        steps: true,
      },
    });

    if (!tx) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    const isParty = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(userId);
    if (!isParty) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    return Response.json({
      id: tx.id,
      property_identity: tx.propertyIdentity,
      listing_id: tx.listingId,
      buyer: tx.buyer,
      seller: tx.seller,
      broker: tx.broker,
      offer_price: tx.offerPrice,
      status: tx.status,
      frozen_by_admin: tx.frozenByAdmin,
      created_at: tx.createdAt,
      updated_at: tx.updatedAt,
      offers: tx.offers.map((o) => ({
        id: o.id,
        offer_price: o.offerPrice,
        conditions: o.conditions,
        expiration_date: o.expirationDate,
        status: o.status,
        created_at: o.createdAt,
        counter_offers: o.counterOffers.map((c) => ({
          id: c.id,
          counter_price: c.counterPrice,
          notes: c.notes,
          created_at: c.createdAt,
        })),
      })),
      messages: tx.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        message: m.message,
        created_at: m.createdAt,
      })),
      deposits: tx.deposits.map((d) => ({
        id: d.id,
        amount: d.amount,
        payment_provider: d.paymentProvider,
        payment_status: d.paymentStatus,
        created_at: d.createdAt,
      })),
      documents: tx.documents.map((d) => ({
        id: d.id,
        document_type: d.documentType,
        file_url: d.fileUrl,
        signed_by_buyer: d.signedByBuyer,
        signed_by_seller: d.signedBySeller,
        signed_by_broker: d.signedByBroker,
        signed_at: d.signedAt,
      })),
      steps: tx.steps.map((s) => ({
        id: s.id,
        step_name: s.stepName,
        status: s.status,
        completed_at: s.completedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}
