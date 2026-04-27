import { prisma } from "@/lib/db";
import { sybnbConfig, SYBNB_PAYOUTS_KILL_SWITCH } from "@/config/sybnb.config";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";

export const SYBNB_ESCROW_HELD = "HELD" as const;
export const SYBNB_ESCROW_ELIGIBLE = "ELIGIBLE" as const;
export const SYBNB_ESCROW_RELEASED = "RELEASED" as const;
export const SYBNB_ESCROW_BLOCKED = "BLOCKED" as const;

/**
 * When host net can be marked eligible for admin release (checkout + delay, internal clock only).
 */
export function computeReleaseEligibleAt(checkOut: Date, delayHours: number): Date {
  const h = Math.max(1, Math.floor(delayHours));
  return new Date(checkOut.getTime() + h * 3600000);
}

export type PayoutReleaseRequest = { type: "admin"; actorId: string } | { type: "system" };

export type PayoutReleaseAssertResult =
  | { ok: true }
  | { ok: false; code: "PAYOUT_RELEASE_BLOCKED"; message: string };

function hostVerifiedForPayout(
  host: { phoneVerifiedAt: Date | null; verifiedAt: Date | null },
): boolean {
  return Boolean(host.phoneVerifiedAt || host.verifiedAt);
}

function isRiskBlocking(risk: string | null | undefined): boolean {
  const u = (risk ?? "").trim().toUpperCase();
  return u === "HIGH" || u === "BLOCK";
}

/**
 * Idempotent: promote HELD → ELIGIBLE when the release window has passed (no money movement).
 */
export async function refreshSybnbEscrowEligibilityForCompletedStays(): Promise<void> {
  if (!sybnbConfig.escrowEnabled) return;
  const now = new Date();
  const candidates = await prisma.syriaPayout.findMany({
    where: {
      escrowStatus: SYBNB_ESCROW_HELD,
      releaseEligibleAt: { lte: now },
      booking: { property: { category: "stay" } },
    },
    take: 500,
    select: { id: true, bookingId: true },
  });
  if (candidates.length === 0) return;
  const { appendSyriaSybnbCoreAudit } = await import("@/lib/sybnb/sybnb-financial-audit");
  for (const c of candidates) {
    await prisma.syriaPayout.update({
      where: { id: c.id },
      data: { escrowStatus: SYBNB_ESCROW_ELIGIBLE },
    });
    await appendSyriaSybnbCoreAudit({
      bookingId: c.bookingId,
      event: "SYBNB_PAYOUT_RELEASE_ELIGIBLE",
      metadata: { payoutId: c.id, source: "escrow_eligibility_refresh" },
    });
  }
}

/**
 * Enforces internal escrow rules before an admin (or future system job) may mark a payout as released in the ledger.
 * Does not call external payment providers.
 */
export async function assertSybnbPayoutReleaseAllowed(input: {
  payoutId: string;
  request: PayoutReleaseRequest;
}): Promise<PayoutReleaseAssertResult> {
  if (SYBNB_PAYOUTS_KILL_SWITCH) {
    return {
      ok: false,
      code: "PAYOUT_RELEASE_BLOCKED",
      message: "Payout release is temporarily unavailable. Please try again later.",
    };
  }

  if (input.request.type === "system" && sybnbConfig.manualPayoutApprovalRequired) {
    return {
      ok: false,
      code: "PAYOUT_RELEASE_BLOCKED",
      message: "Automatic payout release is disabled.",
    };
  }
  if (input.request.type === "system" && !sybnbConfig.autoReleasePayouts) {
    return {
      ok: false,
      code: "PAYOUT_RELEASE_BLOCKED",
      message: "Automatic payout release is off.",
    };
  }

  const payout = await prisma.syriaPayout.findUnique({
    where: { id: input.payoutId.trim() },
    include: {
      booking: { include: { property: { include: { owner: true } } } },
    },
  });
  if (!payout) {
    return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Payout not found." };
  }
  if (payout.status === "PAID" || payout.escrowStatus === SYBNB_ESCROW_RELEASED) {
    return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "This payout is already released or settled." };
  }

  if (sybnbConfig.escrowEnabled) {
    if (payout.escrowStatus === SYBNB_ESCROW_BLOCKED || payout.escrowStatus === "REFUNDED" || payout.escrowStatus === "DISPUTED") {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "This payout cannot be released in its current state." };
    }
    if (payout.escrowStatus !== SYBNB_ESCROW_HELD && payout.escrowStatus !== SYBNB_ESCROW_ELIGIBLE) {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Payout is not in a releasable escrow state." };
    }
    const now = new Date();
    if (payout.releaseEligibleAt && payout.releaseEligibleAt > now) {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Payout is not yet eligible for release." };
    }
  } else if (payout.escrowStatus === SYBNB_ESCROW_BLOCKED) {
    return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "This payout cannot be released in its current state." };
  }

  const b = payout.booking;
  const p = b.property;
  if (b.property.category === "stay") {
    if (b.status !== "CONFIRMED" && b.status !== "COMPLETED") {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Stay booking must be confirmed or completed first." };
    }
    if (p.sybnbReview !== "APPROVED" || p.status !== "PUBLISHED" || p.fraudFlag) {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Listing is not in an approved, published state for payout." };
    }
    if (!hostVerifiedForPayout(p.owner)) {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Host verification is required before release." };
    }
    if (p.owner.sybnbSupplyPaused || p.owner.flagged) {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Host account is not eligible for payout at this time." };
    }
  } else {
    if (b.status !== "COMPLETED" && b.status !== "CONFIRMED") {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Booking is not in a state that allows payout release." };
    }
  }

  if (isRiskBlocking(payout.riskStatus)) {
    return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Payout is under review and cannot be released yet." };
  }
  if (b.riskStatus === "blocked") {
    return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Booking risk status blocks payout release." };
  }

  if (input.request.type === "admin" && sybnbConfig.manualPayoutApprovalRequired) {
    // Admin path is always explicit via requireAdmin() on the server action; actor must match a real user id.
    if (!input.request.actorId.trim()) {
      return { ok: false, code: "PAYOUT_RELEASE_BLOCKED", message: "Admin approval is required for this action." };
    }
  }

  return { ok: true };
}

/**
 * Marks internal escrow + ledger approval for a stay payout (no PSP transfer).
 * Call only after {@link assertSybnbPayoutReleaseAllowed} succeeds; validates stay + escrow mode.
 */
export async function applySybnbPayoutEscrowReleaseApproved(input: {
  payoutId: string;
  adminId: string;
  request: PayoutReleaseRequest;
}): Promise<PayoutReleaseAssertResult> {
  const pre = await prisma.syriaPayout.findUnique({
    where: { id: input.payoutId.trim() },
    include: { booking: { include: { property: true } } },
  });
  if (!pre || pre.booking.property.category !== "stay" || !sybnbConfig.escrowEnabled) {
    return {
      ok: false,
      code: "PAYOUT_RELEASE_BLOCKED",
      message: "Escrow release is not available for this payout.",
    };
  }

  const gate = await assertSybnbPayoutReleaseAllowed({
    payoutId: input.payoutId,
    request: input.request,
  });
  if (!gate.ok) return gate;

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.syriaPayout.update({
      where: { id: pre.id },
      data: {
        escrowStatus: SYBNB_ESCROW_RELEASED,
        releasedAt: now,
        releaseApprovedById: input.adminId,
        releaseApprovedAt: now,
        status: "APPROVED",
        approvedAt: now,
      },
    });
    await tx.syriaBooking.update({
      where: { id: pre.bookingId },
      data: { payoutStatus: "APPROVED" },
    });
  });

  await appendSyriaSybnbCoreAudit({
    bookingId: pre.bookingId,
    event: "SYBNB_PAYOUT_RELEASE_APPROVED",
    metadata: {
      payoutId: pre.id,
      adminId: input.adminId,
      source: "escrow_admin_release",
    },
  });

  return { ok: true };
}

/**
 * Human-readable host copy (no internal scores).
 */
export function hostEscrowStatusLabel(escrowStatus: string): "held" | "review" | "eligibleSoon" | "released" | "blocked" {
  const s = escrowStatus.toUpperCase();
  if (s === SYBNB_ESCROW_RELEASED) return "released";
  if (s === SYBNB_ESCROW_BLOCKED) return "blocked";
  if (s === SYBNB_ESCROW_ELIGIBLE) return "eligibleSoon";
  if (s === "REFUNDED" || s === "DISPUTED") return "review";
  return "held";
}
