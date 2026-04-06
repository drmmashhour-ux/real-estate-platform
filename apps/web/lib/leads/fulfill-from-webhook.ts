import type { PrismaClient } from "@prisma/client";
import { ListingAnalyticsKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { incrementUnlockCheckoutSuccess } from "@/lib/listings/listing-analytics-service";

export type FulfillListingContactLeadResult =
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; reason: string };

/**
 * Marks a listing-contact lead purchase paid after Stripe Checkout succeeds.
 * Idempotent; validates payer, amount, and session id.
 */
export async function fulfillListingContactLeadFromWebhook(
  db: PrismaClient,
  input: {
    purchaseId: string;
    payerUserId: string;
    amountCents: number;
    stripeSessionId: string;
  },
): Promise<FulfillListingContactLeadResult> {
  const row = await db.listingContactLeadPurchase.findUnique({ where: { id: input.purchaseId } });
  if (!row) return { ok: false, reason: "purchase_not_found" };
  if (row.buyerUserId !== input.payerUserId) return { ok: false, reason: "buyer_mismatch" };
  if (row.status === "paid") return { ok: true, alreadyPaid: true };
  if (input.amountCents < row.priceCents) return { ok: false, reason: "amount_too_low" };
  if (row.stripeCheckoutSessionId && row.stripeCheckoutSessionId !== input.stripeSessionId) {
    return { ok: false, reason: "session_mismatch" };
  }

  await db.listingContactLeadPurchase.update({
    where: { id: row.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      stripeCheckoutSessionId: input.stripeSessionId,
    },
  });

  const analyticsKind =
    row.targetKind === "FSBO_LISTING" ? ListingAnalyticsKind.FSBO : ListingAnalyticsKind.CRM;
  void incrementUnlockCheckoutSuccess(analyticsKind, row.targetListingId).catch(() => {});

  return { ok: true };
}

/** Dev-only escape hatch: never use in production paths. */
export async function __dangerouslyMarkListingContactPaidForTests(purchaseId: string): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  await prisma.listingContactLeadPurchase.update({
    where: { id: purchaseId },
    data: { status: "paid", paidAt: new Date() },
  });
}
