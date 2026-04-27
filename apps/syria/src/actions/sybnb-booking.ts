"use server";

import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { syriaFlags } from "@/lib/platform-flags";
import { redirect } from "@/i18n/navigation";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { parseUtmFromFormData } from "@/lib/utm";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { sybnbConfig } from "@/config/sybnb.config";
import { computeSybnbQuote } from "@/lib/sybnb/sybnb-quote";
import { computeReleaseEligibleAt, refreshSybnbEscrowEligibilityForCompletedStays } from "@/lib/sybnb/payout-release-policy";
import { evaluateSybnbStayRequestEligibility } from "@/lib/sybnb/sybnb-booking-rules";
import { countUnreviewedSybnbReportsForProperty } from "@/lib/sybnb/sybnb-reports";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";
import { recomputeSy8FeedRankForPropertyId } from "@/lib/sy8/sy8-feed-rank-refresh";
import { runSybnbHostStayResponse } from "@/lib/sybnb/host-stay-response";

export type SybnbQuoteResult =
  | {
      ok: true;
      nights: number;
      nightly: string;
      total: string;
      platformFee: string;
      hostNet: string;
      currency: string;
    }
  | { ok: false; error: "not_found" | "invalid" };

/**
 * Server-side quote for the listing detail page (same math as `createSybnbStayBooking`).
 * Amounts are never taken from the client; only `computeSybnbQuote` + server DB.
 */
export async function getSybnbStayQuote(input: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<SybnbQuoteResult> {
  const property = await prisma.syriaProperty.findUnique({
    where: { id: input.propertyId.trim() },
    include: { owner: true },
  });
  if (!property || property.category !== "stay" || property.type !== "RENT") {
    return { ok: false, error: "not_found" };
  }
  const unreviewed = await countUnreviewedSybnbReportsForProperty(property.id);
  if (evaluateSybnbStayRequestEligibility(property, property.owner, { unreviewedReportCount: unreviewed }).ok !== true) {
    return { ok: false, error: "not_found" };
  }
  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  if (Number.isNaN(+checkIn) || Number.isNaN(+checkOut) || checkOut <= checkIn) {
    return { ok: false, error: "invalid" };
  }
  const q = computeSybnbQuote(property, checkIn, checkOut);
  return {
    ok: true,
    nights: q.nights,
    nightly: q.nightly.toString(),
    total: q.total.toString(),
    platformFee: q.platformFee.toString(),
    hostNet: q.hostNet.toString(),
    currency: q.currency,
  };
}

/**
 * After checkout date, mark confirmed stays as completed (SYBNB / stay only).
 */
export async function runSybnbPostStayCompletion(): Promise<void> {
  const now = new Date();
  const rows = await prisma.syriaBooking.findMany({
    where: {
      status: "CONFIRMED",
      checkOut: { lt: now },
      property: { category: "stay" },
    },
    select: { id: true },
  });
  if (rows.length === 0) return;
  await prisma.syriaBooking.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { status: "COMPLETED" },
  });
}

/**
 * Request-to-book for SYBNB (`category=stay`, `type=RENT`). Host confirms from dashboard; payout row created like BNHUB.
 */
export async function createSybnbStayBooking(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  if (syriaFlags.SYRIA_MVP) {
    return;
  }

  const guest = await requireSessionUser();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const checkInRaw = String(formData.get("check_in") ?? "");
  const checkOutRaw = String(formData.get("check_out") ?? "");
  const manualRef = String(formData.get("manual_ref") ?? "").trim() || null;
  const proofUrl = String(formData.get("proof_url") ?? "").trim() || null;
  const guestCountRaw = Number(String(formData.get("guest_count") ?? "").trim());
  const utm = parseUtmFromFormData(formData);

  const checkIn = new Date(checkInRaw);
  const checkOut = new Date(checkOutRaw);
  if (!propertyId || Number.isNaN(+checkIn) || Number.isNaN(+checkOut)) {
    return;
  }
  if (checkOut <= checkIn) {
    return;
  }

  const property = await prisma.syriaProperty.findUnique({
    where: { id: propertyId },
    include: { owner: true },
  });
  if (!property || property.category !== "stay" || property.type !== "RENT") {
    return;
  }
  const unreviewed = await countUnreviewedSybnbReportsForProperty(property.id);
  if (evaluateSybnbStayRequestEligibility(property, property.owner, { unreviewedReportCount: unreviewed }).ok !== true) {
    return;
  }
  if (guest.id === property.ownerId) {
    return;
  }

  const q = computeSybnbQuote(property, checkIn, checkOut);
  const guestCount = Number.isFinite(guestCountRaw) && guestCountRaw > 0 ? Math.floor(guestCountRaw) : null;
  const guestPaymentStatus = manualRef ? "PENDING_MANUAL" : "UNPAID";
  const releaseEligibleAt = sybnbConfig.escrowEnabled
    ? computeReleaseEligibleAt(checkOut, sybnbConfig.payoutDelayHours)
    : null;

  const created = await prisma.$transaction(async (tx) => {
    const b = await tx.syriaBooking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        checkIn,
        checkOut,
        nightsCount: q.nights,
        nightlyRate: q.nightly,
        totalPrice: q.total,
        platformFeeAmount: q.platformFee,
        hostNetAmount: q.hostNet,
        currency: q.currency,
        status: "PENDING",
        guestPaymentStatus,
        payoutStatus: "PENDING",
        manualPaymentRef: manualRef,
        proofUrl,
        guestCount,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
      },
    });
    await tx.syriaPayout.create({
      data: {
        bookingId: b.id,
        hostId: property.ownerId,
        amount: q.hostNet,
        platformFee: q.platformFee,
        currency: q.currency,
        status: "PENDING",
      },
    });
    return b;
  });

  await appendSyriaSybnbCoreAudit({
    bookingId: created.id,
    event: "stay_request_created",
    metadata: { total: q.total.toString(), currency: q.currency, nights: q.nights },
  });
  await appendSyriaSybnbCoreAudit({
    bookingId: created.id,
    event: "SYBNB_ESCROW_CREATED",
    metadata: {
      releaseEligibleAt: releaseEligibleAt?.toISOString() ?? null,
      delayHours: sybnbConfig.payoutDelayHours,
    },
  });

  await trackSyriaGrowthEvent({
    eventType: "sybnb_booking_request_created",
    userId: guest.id,
    propertyId: property.id,
    bookingId: created.id,
    utm,
    payload: {
      nights: q.nights,
      total: created.totalPrice.toString(),
      provider: sybnbConfig.provider,
    },
  });

  await recomputeSy8FeedRankForPropertyId(property.id);

  await revalidateSyriaPaths(
    `/listing/${propertyId}`,
    "/dashboard/bookings",
    "/sybnb",
    "/admin/bookings",
  );
  redirect({ href: "/dashboard/bookings", locale: "ar" });
}

export async function hostRespondSybnbBooking(formData: FormData): Promise<void> {
  if (syriaFlags.SYRIA_MVP) {
    return;
  }

  const user = await requireSessionUser();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim().toLowerCase();
  if (!bookingId || (action !== "confirm" && action !== "decline")) {
    return;
  }

  await runSybnbHostStayResponse({
    user,
    bookingId,
    action: action === "decline" ? "decline" : "confirm",
  });
}
