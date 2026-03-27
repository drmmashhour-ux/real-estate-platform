import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function platformCategory(paymentType: string): string {
  const map: Record<string, string> = {
    booking: "platform_booking_service_fee",
    subscription: "platform_subscription_fee",
    lead_unlock: "platform_lead_service_fee",
    mortgage_contact_unlock: "platform_mortgage_contact_unlock_fee",
    deposit: "platform_deal_deposit_fee",
    closing_fee: "platform_deal_closing_fee",
    featured_listing: "platform_featured_listing_fee",
  };
  return map[paymentType] ?? `platform_fee_${paymentType}`;
}

function brokerCategory(paymentType: string): string {
  const map: Record<string, string> = {
    booking: "broker_booking_commission",
    subscription: "broker_subscription_share",
    lead_unlock: "broker_lead_commission",
    deposit: "broker_deal_commission",
    closing_fee: "broker_deal_commission",
    featured_listing: "broker_featured_share",
  };
  return map[paymentType] ?? `broker_revenue_${paymentType}`;
}

/**
 * Writes separate PLATFORM and BROKER ledger rows for one payment (never mixed).
 */
export async function createRevenueLedgerForPayment(params: {
  platformPaymentId: string;
  paymentType: string;
  platformAmountCents: number;
  brokerAmountCents: number;
  brokerId: string | null;
  brokerCommissionId: string | null;
  dealId: string | null;
  listingId: string | null;
  currency: string;
}): Promise<void> {
  const rows: Prisma.PartyRevenueLedgerEntryCreateManyInput[] = [];

  if (params.platformAmountCents > 0) {
    rows.push({
      platformPaymentId: params.platformPaymentId,
      party: "PLATFORM",
      category: platformCategory(params.paymentType),
      amountCents: params.platformAmountCents,
      currency: params.currency,
      dealId: params.dealId,
      listingId: params.listingId,
      brokerCommissionId: null,
      brokerId: null,
    });
  }

  if (params.brokerAmountCents > 0 && params.brokerId && params.brokerCommissionId) {
    rows.push({
      platformPaymentId: params.platformPaymentId,
      party: "BROKER",
      category: brokerCategory(params.paymentType),
      amountCents: params.brokerAmountCents,
      currency: params.currency,
      dealId: params.dealId,
      listingId: params.listingId,
      brokerCommissionId: params.brokerCommissionId,
      brokerId: params.brokerId,
    });
  }

  if (rows.length === 0) return;
  await prisma.partyRevenueLedgerEntry.createMany({ data: rows });
}
