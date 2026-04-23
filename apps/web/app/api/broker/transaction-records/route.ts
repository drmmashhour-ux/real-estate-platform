import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createTaxRecordFromCommission } from "@/lib/financial/tax-records";
import { createTransactionRecord } from "@/lib/financial/transaction-records";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST — Create or update broker transaction record (won/lost/pending).
 * For unsuccessful transactions (outcome=lost), lossReason should be provided.
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const brokerId = user.role === "ADMIN" && typeof body.brokerId === "string" ? body.brokerId : userId;

  const outcome = String(body.outcome ?? "pending");
  if (outcome === "lost" && !String(body.lossReason ?? "").trim()) {
    return NextResponse.json(
      { error: "lossReason is recommended for unsuccessful transaction records" },
      { status: 400 }
    );
  }

  const row = await prisma.brokerTransactionRecord.create({
    data: {
      brokerId,
      leadId: typeof body.leadId === "string" ? body.leadId : null,
      contractId: typeof body.contractId === "string" ? body.contractId : null,
      offerDocumentId: typeof body.offerDocumentId === "string" ? body.offerDocumentId : null,
      transactionType: String(body.transactionType ?? "sell"),
      outcome,
      grossRevenueCents: Math.round(Number(body.grossRevenueCents ?? 0)),
      brokerCommissionCents: Math.round(Number(body.brokerCommissionCents ?? 0)),
      platformCommissionCents: Math.round(Number(body.platformCommissionCents ?? 0)),
      expensesCents: Math.round(Number(body.expensesCents ?? 0)),
      netBrokerIncomeCents: Math.round(Number(body.netBrokerIncomeCents ?? 0)),
      lossReason: body.lossReason ? String(body.lossReason) : null,
      notes: body.notes ? String(body.notes) : null,
      closedAt: body.closedAt ? new Date(String(body.closedAt)) : null,
    },
  });

  if (outcome === "won") {
    try {
      const brokerAmt = Math.round(Number(body.brokerCommissionCents ?? 0));
      const platformAmt = Math.round(Number(body.platformCommissionCents ?? 0));
      const commissionTotal = brokerAmt + platformAmt;
      const taxableBase = brokerAmt > 0 ? brokerAmt : commissionTotal;

      const fin = await createTransactionRecord({
        ownerType: "solo_broker",
        ownerId: brokerId,
        listingId: typeof body.listingId === "string" ? body.listingId : null,
        dealId: typeof body.dealId === "string" ? body.dealId : null,
        contractId: typeof body.contractId === "string" ? body.contractId : null,
        contractNumber: typeof body.contractNumber === "string" ? body.contractNumber : null,
        transactionType: String(body.transactionType ?? "sell"),
        transactionStatus: "completed",
        buyerName: body.buyerName ? String(body.buyerName) : null,
        sellerName: body.sellerName ? String(body.sellerName) : null,
        grossPriceCents: Math.round(Number(body.grossRevenueCents ?? 0)) || null,
        commissionBaseCents: brokerAmt || null,
        commissionTotalCents: commissionTotal || null,
        brokerAmountCents: brokerAmt || null,
        agencyAmountCents: null,
        platformAmountCents: platformAmt || null,
        closingDate: body.closedAt ? new Date(String(body.closedAt)) : new Date(),
        notes: body.notes ? String(body.notes) : null,
        createdById: userId,
      });

      if (taxableBase > 0) {
        await createTaxRecordFromCommission({
          ownerType: "solo_broker",
          ownerId: brokerId,
          transactionRecordId: fin.id,
          relatedType: "commission",
          relatedId: typeof body.dealId === "string" ? body.dealId : row.id,
          taxableBaseCents: taxableBase,
          date: new Date(),
        });
      }
    } catch (e) {
      logError("[broker.transaction-records.financial-registry]", e);
    }
  }

  return NextResponse.json({ ok: true, id: row.id });
}

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.brokerTransactionRecord.findMany({
    where: { brokerId: userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ records: rows });
}
