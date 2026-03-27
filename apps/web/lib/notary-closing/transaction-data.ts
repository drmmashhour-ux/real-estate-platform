/**
 * Fetch transaction and related data for closing package – maps to placeholder context.
 */

import { prisma } from "@/lib/db";

function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function getTransactionClosingContext(transactionId: string) {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
      deposits: true,
      propertyIdentity: {
        include: {
          owners: { where: { isCurrent: true }, take: 5 },
          listingAuthorities: { take: 5, include: { brokerIdentity: true, ownerIdentity: true } },
        },
      },
    },
  });
  if (!tx) return null;

  const totalDeposits = tx.deposits
    .filter((d) => d.paymentStatus === "paid")
    .reduce((sum, d) => sum + d.amount, 0);
  const offerPrice = tx.offerPrice ?? 0;
  const remainingBalance = Math.max(0, offerPrice - totalDeposits);
  const escrowStatus =
    tx.deposits.some((d) => d.paymentStatus === "paid") ? "deposit_received" : "pending";

  const ctx: Record<string, unknown> = {
    transaction_id: tx.id,
    transaction_status: tx.status,
    property_address: tx.propertyIdentity?.normalizedAddress ?? tx.propertyIdentity?.officialAddress ?? "—",
    property_municipality: tx.propertyIdentity?.municipality ?? "—",
    property_province: tx.propertyIdentity?.province ?? "—",
    property_country: tx.propertyIdentity?.country ?? "—",
    cadastre_number: tx.propertyIdentity?.cadastreNumber ?? "—",
    buyer_name: tx.buyer.name ?? tx.buyer.email ?? "—",
    buyer_email: tx.buyer.email ?? "—",
    seller_name: tx.seller.name ?? tx.seller.email ?? "—",
    seller_email: tx.seller.email ?? "—",
    broker_name: tx.broker?.name ?? tx.broker?.email ?? "",
    broker_email: tx.broker?.email ?? "",
    offer_price: formatCents(tx.offerPrice),
    purchase_price: formatCents(tx.offerPrice),
    deposit_amount: formatCents(totalDeposits),
    remaining_balance: formatCents(remainingBalance),
    escrow_status: escrowStatus,
    deposits_paid: totalDeposits,
    purchase_price_cents: offerPrice,
    deposit_amount_cents: totalDeposits,
    remaining_balance_cents: remainingBalance,
    generated_date: formatDate(new Date()),
    closing_date: "", // Optional – can be set when scheduling
    owners: (tx.propertyIdentity as { owners?: Array<{ ownerName: string; ownerSource: string; isCurrent: boolean }> })?.owners?.map((o) => ({
      ownerName: o.ownerName,
      source: o.ownerSource,
      isCurrent: o.isCurrent ? "Yes" : "No",
    })) ?? [],
    verifications: [], // Can be filled from PropertyIdentityVerification if needed
  };

  const auths = (tx.propertyIdentity as { listingAuthorities?: Array<{ authorityType: string; startDate: Date; endDate: Date | null; brokerIdentity?: { legalName: string; licenseNumber: string; brokerageName: string } | null; ownerIdentity?: { legalName: string } | null }> })?.listingAuthorities ?? [];
  ctx.broker_authorizations = auths.map((a) => ({
    authorityType: a.authorityType,
    broker_name: a.brokerIdentity?.legalName ?? "—",
    broker_license: a.brokerIdentity?.licenseNumber ?? "—",
    brokerage_name: a.brokerIdentity?.brokerageName ?? "—",
    owner_name: a.ownerIdentity?.legalName ?? "—",
    start: formatDate(a.startDate),
    end: formatDate(a.endDate),
  }));
  ctx.owner_name = (ctx.owners as Array<{ ownerName: string }>)[0]?.ownerName ?? ctx.seller_name;

  return { context: ctx as Record<string, string | number | Record<string, unknown>[]>, transaction: tx };
}
