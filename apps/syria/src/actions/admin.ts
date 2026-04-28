"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { persistAutonomyPreview } from "@/lib/autonomy-recommendations";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import type { SyriaSybnbListingReview } from "@/generated/prisma";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";
import { recomputeSy8FeedRankForPropertyId } from "@/lib/sy8/sy8-feed-rank-refresh";
import {
  SYBNB_PAYOUTS_KILL_SWITCH,
  sybnbConfig,
} from "@/config/sybnb.config";
import {
  applySybnbPayoutEscrowReleaseApproved,
  SYBNB_ESCROW_BLOCKED,
  SYBNB_ESCROW_RELEASED,
} from "@/lib/sybnb/payout-release-policy";

export async function approveProperty(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const admin = await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  if (!id) return;

  const payments = await prisma.syriaListingPayment.findMany({
    where: { propertyId: id },
  });
  const premiumPaid = payments.some(
    (p) => p.purpose === "PREMIUM" && p.status === "VERIFIED",
  );
  const featuredPaid = payments.some(
    (p) => p.purpose === "FEATURED" && p.status === "VERIFIED",
  );
  const premiumPayment = payments.find(
    (p) => p.purpose === "PREMIUM" && p.status === "VERIFIED",
  );
  const featuredPayment = payments.find(
    (p) => p.purpose === "FEATURED" && p.status === "VERIFIED",
  );

  const effectivePlan = premiumPaid ? "premium" : featuredPaid ? "featured" : "free";
  const hasBoost = effectivePlan === "premium" || effectivePlan === "featured";
  const placementPayment = premiumPaid ? premiumPayment : featuredPayment;

  const durationMs =
    syriaPlatformConfig.monetization.featuredDurationDays * 24 * 60 * 60 * 1000;
  const featuredUntil = hasBoost ? new Date(Date.now() + durationMs) : null;
  const homePriority = effectivePlan === "premium" ? 20 : effectivePlan === "featured" ? 10 : 0;
  const searchBoostPriority = effectivePlan === "premium" ? 12 : effectivePlan === "featured" ? 6 : 0;

  await prisma.$transaction(async (tx) => {
    await tx.syriaProperty.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        plan: effectivePlan,
        isFeatured: hasBoost,
        featuredUntil,
        featuredPriority: homePriority,
      },
    });

    if (hasBoost && placementPayment) {
      const startsAt = new Date();
      const endsAt = featuredUntil;
      await tx.syriaFeaturedPlacement.deleteMany({
        where: { propertyId: id, zone: { in: ["HOME", "SEARCH_BOOST"] } },
      });
      await tx.syriaFeaturedPlacement.createMany({
        data: [
          {
            propertyId: id,
            zone: "HOME",
            priority: homePriority,
            active: true,
            startsAt,
            endsAt,
            linkedListingPaymentId: placementPayment.id,
          },
          {
            propertyId: id,
            zone: "SEARCH_BOOST",
            priority: searchBoostPriority,
            active: true,
            startsAt,
            endsAt,
            linkedListingPaymentId: placementPayment.id,
          },
        ],
      });
    } else {
      await tx.syriaFeaturedPlacement.deleteMany({
        where: { propertyId: id, zone: { in: ["HOME", "SEARCH_BOOST"] } },
      });
    }
  });

  await recomputeSy8FeedRankForPropertyId(id);

  await revalidateSyriaPaths("/admin/listings", "/buy", "/rent", "/bnhub/stays", "/sybnb", "/");
  void logSecurityEvent({ action: "admin_listing_approved", userId: admin.id, metadata: { propertyId: id } });
}

export async function setSybnbListingReview(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const admin = await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  const raw = String(formData.get("review") ?? "").trim().toUpperCase();
  if (!id) return;
  if (raw !== "APPROVED" && raw !== "REJECTED" && raw !== "PENDING") return;

  const next = raw as SyriaSybnbListingReview;
  const updated = await prisma.syriaProperty.updateMany({
    where: { id, category: "stay" },
    data: { sybnbReview: next },
  });
  if (updated.count === 0) return;

  await revalidateSyriaPaths("/admin/listings", "/sybnb", "/");
  void logSecurityEvent({
    action: "admin_sybnb_listing_review",
    userId: admin.id,
    metadata: { propertyId: id, review: next },
  });
}

export async function setSybnbListingFieldAgent(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const admin = await requireAdmin();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const clear = String(formData.get("clearAgent") ?? "").trim() === "1";
  const agentEmailRaw = String(formData.get("agentEmail") ?? "").trim().toLowerCase();
  if (!propertyId) return;

  const listing = await prisma.syriaProperty.findUnique({
    where: { id: propertyId },
    select: { id: true, category: true },
  });
  if (!listing || listing.category !== "stay") return;

  let sybnbAgentUserId: string | null | undefined;

  if (clear) {
    sybnbAgentUserId = null;
  } else if (agentEmailRaw.length > 0) {
    const agent = await prisma.syriaAppUser.findUnique({
      where: { email: agentEmailRaw },
      select: { id: true },
    });
    if (!agent) return;
    sybnbAgentUserId = agent.id;
  } else {
    return;
  }

  await prisma.syriaProperty.update({
    where: { id: propertyId },
    data: { sybnbAgentUserId },
  });

  await revalidateSyriaPaths("/admin/listings", "/admin/sybnb/agents", "/sybnb/agents", "/sybnb");
  void logSecurityEvent({
    action: "admin_sybnb_field_agent_set",
    userId: admin.id,
    metadata: { propertyId, cleared: clear, agentEmail: clear ? null : agentEmailRaw || null },
  });
}

export async function rejectProperty(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  if (!id) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  await revalidateSyriaPaths("/admin/listings");
}

export async function verifyListingPayment(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("paymentId") ?? "").trim();
  if (!id) return;

  await prisma.syriaListingPayment.update({
    where: { id },
    data: { status: "VERIFIED" },
  });

  await revalidateSyriaPaths("/admin/listings");
}

export async function verifyGuestBookingPayment(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return;

  const booking = await prisma.syriaBooking.update({
    where: { id: bookingId },
    data: { guestPaymentStatus: "PAID", status: "CONFIRMED" },
  });

  await trackSyriaGrowthEvent({
    eventType: "booking_confirmed",
    userId: booking.guestId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    payload: {
      total: booking.totalPrice.toString(),
      platformFee: booking.platformFeeAmount?.toString() ?? null,
      hostNet: booking.hostNetAmount?.toString() ?? null,
      currency: booking.currency,
    },
  });

  await revalidateSyriaPaths("/admin/bookings", "/dashboard/bookings");
}

export async function approvePayout(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const admin = await requireAdmin();
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) return;

  if (SYBNB_PAYOUTS_KILL_SWITCH) {
    const row = await prisma.syriaPayout.findUnique({
      where: { id: payoutId },
      select: { bookingId: true },
    });
    await appendSyriaSybnbCoreAudit({
      bookingId: row?.bookingId ?? null,
      event: "SYBNB_PAYOUT_KILL_SWITCH_BLOCKED",
      metadata: { payoutId, adminId: admin.id, action: "approvePayout" },
    });
    void logSecurityEvent({
      action: "admin_payout_blocked_kill_switch",
      userId: admin.id,
      metadata: { payoutId },
    });
    return;
  }

  const row = await prisma.syriaPayout.findUnique({
    where: { id: payoutId },
    include: { booking: { include: { property: true } } },
  });
  if (!row || row.status !== "PENDING") return;

  const isStayEscrow = row.booking.property.category === "stay" && sybnbConfig.escrowEnabled;

  if (isStayEscrow) {
    const result = await applySybnbPayoutEscrowReleaseApproved({
      payoutId,
      adminId: admin.id,
      request: { type: "admin", actorId: admin.id },
    });
    if (!result.ok) {
      await appendSyriaSybnbCoreAudit({
        bookingId: row.bookingId,
        event: "SYBNB_PAYOUT_RELEASE_DENIED",
        metadata: { payoutId, code: result.code },
      });
      throw new Error(result.message);
    }
    await revalidateSyriaPaths("/admin/payouts", "/admin/bookings");
    void logSecurityEvent({
      action: "admin_payout_approved",
      userId: admin.id,
      metadata: { payoutId, escrowRelease: true },
    });
    return;
  }

  const updated = await prisma.syriaPayout.updateMany({
    where: { id: payoutId, status: "PENDING" },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  if (updated.count === 0) return;

  const payout = await prisma.syriaPayout.findUniqueOrThrow({
    where: { id: payoutId },
  });

  await prisma.syriaBooking.update({
    where: { id: payout.bookingId },
    data: { payoutStatus: "APPROVED" },
  });

  await revalidateSyriaPaths("/admin/payouts", "/admin/bookings");
  void logSecurityEvent({ action: "admin_payout_approved", userId: admin.id, metadata: { payoutId } });
}

/** Stay SYBNB: approve internal escrow release (ledger APPROVED; no PSP transfer). */
export async function approveSybnbPayoutRelease(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const admin = await requireAdmin();
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) return;

  if (SYBNB_PAYOUTS_KILL_SWITCH) {
    const row = await prisma.syriaPayout.findUnique({
      where: { id: payoutId },
      select: { bookingId: true },
    });
    await appendSyriaSybnbCoreAudit({
      bookingId: row?.bookingId ?? null,
      event: "SYBNB_PAYOUT_KILL_SWITCH_BLOCKED",
      metadata: { payoutId, adminId: admin.id, action: "approveSybnbPayoutRelease" },
    });
    void logSecurityEvent({
      action: "admin_payout_blocked_kill_switch",
      userId: admin.id,
      metadata: { payoutId },
    });
    return;
  }

  const row = await prisma.syriaPayout.findUnique({
    where: { id: payoutId },
    include: { booking: { include: { property: true } } },
  });
  if (!row || row.status !== "PENDING") return;
  if (row.booking.property.category !== "stay" || !sybnbConfig.escrowEnabled) return;

  const result = await applySybnbPayoutEscrowReleaseApproved({
    payoutId,
    adminId: admin.id,
    request: { type: "admin", actorId: admin.id },
  });
  if (!result.ok) {
    await appendSyriaSybnbCoreAudit({
      bookingId: row.bookingId,
      event: "SYBNB_PAYOUT_RELEASE_DENIED",
      metadata: { payoutId, code: result.code },
    });
    throw new Error(result.message);
  }

  await revalidateSyriaPaths("/admin/payouts", "/admin/bookings");
  void logSecurityEvent({
    action: "admin_sybnb_escrow_released",
    userId: admin.id,
    metadata: { payoutId },
  });
}

export async function blockSybnbPayout(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const admin = await requireAdmin();
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  const rawReason = String(formData.get("blockedReason") ?? "").trim();
  const blockedReason = rawReason.slice(0, 2000);
  if (!payoutId || !blockedReason) return;

  const row = await prisma.syriaPayout.findUnique({
    where: { id: payoutId },
    include: { booking: { include: { property: true } } },
  });
  if (!row || row.booking.property.category !== "stay" || !sybnbConfig.escrowEnabled) return;
  if (row.escrowStatus === SYBNB_ESCROW_RELEASED || row.status === "PAID") return;

  await prisma.syriaPayout.update({
    where: { id: payoutId },
    data: {
      escrowStatus: SYBNB_ESCROW_BLOCKED,
      blockedAt: new Date(),
      blockedReason,
    },
  });

  await appendSyriaSybnbCoreAudit({
    bookingId: row.bookingId,
    event: "SYBNB_PAYOUT_RELEASE_BLOCKED",
    metadata: { payoutId, adminId: admin.id },
  });

  await revalidateSyriaPaths("/admin/payouts", "/admin/bookings");
  void logSecurityEvent({
    action: "admin_sybnb_payout_blocked",
    userId: admin.id,
    metadata: { payoutId },
  });
}

export async function markPayoutPaid(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const admin = await requireAdmin();
  if (SYBNB_PAYOUTS_KILL_SWITCH) {
    void logSecurityEvent({
      action: "admin_payout_mark_paid_blocked",
      userId: admin.id,
      metadata: { reason: "payouts_kill_switch" },
    });
    return;
  }
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) return;

  const payoutRow = await prisma.syriaPayout.findUnique({
    where: { id: payoutId },
    include: { booking: { include: { property: true } } },
  });
  if (!payoutRow || payoutRow.status !== "APPROVED") return;
  const booking = payoutRow.booking;
  if (
    booking.property.category === "stay" &&
    sybnbConfig.escrowEnabled &&
    payoutRow.escrowStatus !== SYBNB_ESCROW_RELEASED
  ) {
    void logSecurityEvent({
      action: "admin_payout_mark_paid_blocked_escrow",
      userId: admin.id,
      metadata: { payoutId, escrowStatus: payoutRow.escrowStatus },
    });
    await appendSyriaSybnbCoreAudit({
      bookingId: booking.id,
      event: "SYBNB_PAYOUT_RELEASE_DENIED",
      metadata: { payoutId, adminId: admin.id, reason: "mark_paid_requires_escrow_release" },
    });
    return;
  }
  if (booking.property.category === "stay" && booking.status !== "COMPLETED") {
    return;
  }

  const marked = await prisma.syriaPayout.updateMany({
    where: { id: payoutId, status: "APPROVED" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (marked.count === 0) return;

  const existing = await prisma.syriaPayout.findUnique({
    where: { id: payoutId },
  });
  if (!existing) return;

  await prisma.syriaBooking.update({
    where: { id: existing.bookingId },
    data: { payoutStatus: "PAID" },
  });

  await appendSyriaSybnbCoreAudit({
    bookingId: booking.id,
    event: "admin_payout_marked_paid",
    metadata: { adminId: admin.id, payoutId, amount: existing.amount.toString(), currency: existing.currency },
  });

  await revalidateSyriaPaths("/admin/payouts", "/admin/bookings");
  void logSecurityEvent({
    action: "admin_payout_marked_paid",
    userId: admin.id,
    metadata: { payoutId, bookingId: booking.id },
  });
}

export async function setPropertyFraudFlag(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  const fraud = String(formData.get("fraud") ?? "") === "true";

  if (!id) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: { fraudFlag: fraud },
  });

  await revalidateSyriaPaths("/admin/listings");
}

export async function setBookingFraudFlag(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "").trim();
  const fraud = String(formData.get("fraud") ?? "") === "true";

  if (!id) return;

  await prisma.syriaBooking.update({
    where: { id },
    data: { fraudFlag: fraud },
  });

  await revalidateSyriaPaths("/admin/bookings");
}

export async function setUserRole(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "USER").toUpperCase();
  if (!userId) return;
  if (!["USER", "HOST", "ADMIN"].includes(role)) return;

  await prisma.syriaAppUser.update({
    where: { id: userId },
    data: { role: role as "USER" | "HOST" | "ADMIN" },
  });

  await revalidateSyriaPaths("/admin/users");
}

export async function setFeaturedPlacementActive(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const placementId = String(formData.get("placementId") ?? "").trim();
  const active = String(formData.get("active") ?? "true") !== "false";
  if (!placementId) return;

  await prisma.syriaFeaturedPlacement.update({
    where: { id: placementId },
    data: { active },
  });

  await revalidateSyriaPaths("/admin/promotions");
}

export async function regenerateAutonomyRecommendations(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) return;

  const property = await prisma.syriaProperty.findUnique({ where: { id: propertyId } });
  if (!property) return;

  await persistAutonomyPreview(property.id, property.ownerId);

  await revalidateSyriaPaths("/admin/autonomy");
}

export async function resolveAutonomyRecommendation(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").toUpperCase();
  if (!id) return;
  if (statusRaw !== "DISMISSED" && statusRaw !== "ACKNOWLEDGED") return;

  await prisma.syriaAutonomyRecommendation.update({
    where: { id },
    data: { status: statusRaw as "DISMISSED" | "ACKNOWLEDGED", resolvedAt: new Date() },
  });

  await revalidateSyriaPaths("/admin/autonomy");
}
