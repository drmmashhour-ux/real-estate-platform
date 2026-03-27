import {
  BnhubMpDisputeStatus,
  BnhubMpHoldStatus,
  BnhubMpPaymentEventActor,
  BnhubMpPayoutStatus,
  BnhubMpProcessor,
  BnhubMpRiskHold,
  BnhubTrustPayoutGateStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { logPayoutEvent } from "@/modules/bnhub-payments/services/financeAuditService";

export function computeHostNetPayout(params: {
  guestPaidCents: number;
  platformFeeCents: number;
}): { netToHostCents: number } {
  const net = Math.max(0, params.guestPaidCents - params.platformFeeCents);
  return { netToHostCents: net };
}

/**
 * Escrow-like payout control: record expected host transfer; release is gated (cron/admin), not blind automation here.
 * For Stripe Connect destination charges, funds already route to the connected account — this row is operational truth for BNHub release policy.
 */
export async function createPendingPayoutAfterGuestPaid(params: {
  reservationPaymentId: string;
  bookingId: string;
  hostUserId: string;
  listingId: string;
  guestPaidCents: number;
  platformFeeCents: number;
  hostPayoutCents: number;
  currency: string;
}): Promise<void> {
  const existing = await prisma.bnhubHostPayoutRecord.findFirst({
    where: { reservationPaymentId: params.reservationPaymentId },
  });
  if (existing) return;

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: { checkIn: true },
  });
  const eligibleReleaseAt = booking
    ? new Date(booking.checkIn.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;

  const payout = await prisma.bnhubHostPayoutRecord.create({
    data: {
      bookingId: params.bookingId,
      reservationPaymentId: params.reservationPaymentId,
      hostUserId: params.hostUserId,
      listingId: params.listingId,
      processor: BnhubMpProcessor.STRIPE,
      grossAmountCents: params.guestPaidCents,
      platformFeeCents: params.platformFeeCents,
      reserveAmountCents: 0,
      netAmountCents: params.hostPayoutCents,
      currency: params.currency.toLowerCase(),
      payoutStatus: BnhubMpPayoutStatus.HELD,
      releaseReason: "payout_control_window",
      eligibleReleaseAt,
      metadataJson: {
        model: "delayed_release_tracking",
        wording: "Payouts may be held per booking status, risk review, or disputes — not legal escrow.",
      },
    },
  });

  await logPayoutEvent(payout.id, params.bookingId, "payout_record_created", {
    eligibleReleaseAt: eligibleReleaseAt?.toISOString() ?? null,
    held: true,
  });
}

export async function evaluatePayoutEligibility(payoutId: string): Promise<{
  canRelease: boolean;
  reasons: string[];
}> {
  const p = await prisma.bnhubHostPayoutRecord.findUnique({
    where: { id: payoutId },
    include: {
      reservationPayment: {
        include: {
          disputes: {
            where: {
              disputeStatus: {
                in: [
                  BnhubMpDisputeStatus.OPEN,
                  BnhubMpDisputeStatus.WARNING_NEEDS_RESPONSE,
                  BnhubMpDisputeStatus.UNDER_REVIEW,
                ],
              },
            },
          },
          holds: { where: { holdStatus: BnhubMpHoldStatus.ACTIVE } },
        },
      },
    },
  });
  if (!p) return { canRelease: false, reasons: ["payout_not_found"] };
  const reasons: string[] = [];
  const pay = p.reservationPayment;
  if (pay.disputes.length) reasons.push("open_dispute");
  if (pay.holds.length) reasons.push("active_hold");
  if (pay.riskHoldStatus !== BnhubMpRiskHold.NONE) reasons.push("risk_hold");
  const trustEngine = await prisma.bnhubListingTrustRiskProfile.findUnique({
    where: { listingId: p.listingId },
    select: { payoutRestrictionStatus: true },
  });
  if (
    trustEngine?.payoutRestrictionStatus === BnhubTrustPayoutGateStatus.HOLD ||
    trustEngine?.payoutRestrictionStatus === BnhubTrustPayoutGateStatus.RELEASE_BLOCKED
  ) {
    reasons.push("trust_engine_payout_gate");
  }
  if (p.eligibleReleaseAt && p.eligibleReleaseAt.getTime() > Date.now()) {
    reasons.push("before_eligible_release_at");
  }
  return { canRelease: reasons.length === 0, reasons };
}

export async function holdPayout(payoutId: string, reason: string, adminUserId?: string) {
  await prisma.bnhubHostPayoutRecord.update({
    where: { id: payoutId },
    data: {
      payoutStatus: BnhubMpPayoutStatus.HELD,
      releaseReason: reason,
    },
  });
  const p = await prisma.bnhubHostPayoutRecord.findUnique({
    where: { id: payoutId },
    select: { bookingId: true },
  });
  if (p) {
    await logPayoutEvent(payoutId, p.bookingId, "payout_manual_hold", { reason }, adminUserId ? BnhubMpPaymentEventActor.ADMIN : BnhubMpPaymentEventActor.SYSTEM, adminUserId);
  }
}

export async function releasePayout(payoutId: string, reason: string, adminUserId?: string) {
  await prisma.bnhubHostPayoutRecord.update({
    where: { id: payoutId },
    data: {
      payoutStatus: BnhubMpPayoutStatus.SCHEDULED,
      releaseReason: reason,
      releasedAt: new Date(),
    },
  });
  const p = await prisma.bnhubHostPayoutRecord.findUnique({
    where: { id: payoutId },
    select: { bookingId: true },
  });
  if (p) {
    await logPayoutEvent(payoutId, p.bookingId, "payout_release_marked", { reason }, adminUserId ? BnhubMpPaymentEventActor.ADMIN : BnhubMpPaymentEventActor.SYSTEM, adminUserId);
  }
}

export async function getHostPayoutSummary(hostUserId: string) {
  return prisma.bnhubHostPayoutRecord.findMany({
    where: { hostUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      bookingId: true,
      payoutStatus: true,
      grossAmountCents: true,
      netAmountCents: true,
      currency: true,
      eligibleReleaseAt: true,
      releaseReason: true,
      createdAt: true,
    },
  });
}

export async function getAdminPayoutOverview() {
  return prisma.bnhubHostPayoutRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      host: { select: { id: true, email: true, name: true } },
      booking: { select: { id: true, confirmationCode: true } },
    },
  });
}

export async function reversePayoutIfNeeded(_payoutId: string): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "Stripe Connect reversal/clawback requires case-by-case handling — placeholder." };
}
