import type { ListingContactLeadPurchase, ListingContactTargetKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PRICING } from "@/lib/monetization/pricing";
import type { Lead, LeadAccessStatus } from "./types";

function mapStatus(db: string): LeadAccessStatus {
  if (db === "paid") return "paid";
  if (db === "expired") return "expired";
  return "locked";
}

export function toLead(row: ListingContactLeadPurchase): Lead {
  return {
    id: row.id,
    listingId: row.targetListingId,
    buyerId: row.buyerUserId,
    status: mapStatus(row.status),
    priceCents: row.priceCents,
    createdAt: row.createdAt,
    targetKind: row.targetKind,
  };
}

export function canAccessLead(lead: Lead): boolean {
  return lead.status === "paid";
}

export async function getListingContactPurchase(
  buyerUserId: string,
  targetKind: ListingContactTargetKind,
  targetListingId: string,
): Promise<ListingContactLeadPurchase | null> {
  return prisma.listingContactLeadPurchase.findUnique({
    where: {
      buyerUserId_targetKind_targetListingId: { buyerUserId, targetKind, targetListingId },
    },
  });
}

export async function buyerHasPaidListingContact(
  buyerUserId: string,
  targetKind: ListingContactTargetKind,
  targetListingId: string,
): Promise<boolean> {
  const row = await getListingContactPurchase(buyerUserId, targetKind, targetListingId);
  return row?.status === "paid";
}

/**
 * Creates or returns an existing purchase row (locked) at the current catalog price.
 */
export async function ensureListingContactLeadCheckoutRow(params: {
  buyerUserId: string;
  targetKind: ListingContactTargetKind;
  targetListingId: string;
}): Promise<ListingContactLeadPurchase> {
  const priceCents = PRICING.leadPriceCents;
  const existing = await getListingContactPurchase(
    params.buyerUserId,
    params.targetKind,
    params.targetListingId,
  );
  if (existing) {
    if (existing.status === "paid") {
      throw new Error("already_paid");
    }
    if (existing.priceCents !== priceCents) {
      return prisma.listingContactLeadPurchase.update({
        where: { id: existing.id },
        data: { priceCents },
      });
    }
    return existing;
  }
  return prisma.listingContactLeadPurchase.create({
    data: {
      buyerUserId: params.buyerUserId,
      targetKind: params.targetKind,
      targetListingId: params.targetListingId,
      status: "locked",
      priceCents,
    },
  });
}

export async function attachStripeSessionToListingContactPurchase(
  purchaseId: string,
  buyerUserId: string,
  stripeCheckoutSessionId: string,
): Promise<void> {
  const row = await prisma.listingContactLeadPurchase.findFirst({
    where: { id: purchaseId, buyerUserId, status: { not: "paid" } },
  });
  if (!row) {
    throw new Error("purchase_not_found_or_paid");
  }
  await prisma.listingContactLeadPurchase.update({
    where: { id: purchaseId },
    data: { stripeCheckoutSessionId },
  });
}
