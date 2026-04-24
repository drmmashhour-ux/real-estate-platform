/**
 * BNHub channel availability export — integrates with existing Prisma models:
 * `BnhubExternalListingMapping`, `BnhubChannelListingMapping`, `BnhubOtaSyncLog`, `BnhubChannelSyncLog`.
 *
 * BNHub stays the source of truth; OTAs receive pushes when mappings exist.
 */
import {
  BnhubOtaSyncResultStatus,
  BnhubOtaSyncType,
  BookingStatus,
  BnhubBookingSource,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { pushAvailabilityToChannels } from "@/lib/bnhub/channel-integration";
import { appendOtaSyncLog } from "@/src/modules/bnhub-channel-manager";
import { dispatchPushAvailability } from "./providers/dispatch";
import { ensureBnhubChannelPlaceholderGuest } from "./placeholder-guest";

/** Export availability/pricing fingerprints for OTAs mapped to this listing. */
export async function syncAvailability(listingId: string): Promise<void> {
  await pushAvailabilityToChannels(listingId).catch(() => {});

  const mappings = await prisma.bnhubChannelListingMapping.findMany({
    where: { listingId },
    include: {
      channelConnection: true,
    },
  });

  for (const map of mappings) {
    const conn = map.channelConnection;
    try {
      await dispatchPushAvailability(conn.platform, {
        listingId,
        externalListingRef: map.externalListingRef,
        connectionId: conn.id,
      });
      await appendOtaSyncLog({
        connectionId: conn.id,
        listingId,
        syncType: BnhubOtaSyncType.EXPORT,
        status: BnhubOtaSyncResultStatus.SUCCESS,
        message: `Availability export (${conn.platform}) scheduled — API stub`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await appendOtaSyncLog({
        connectionId: conn.id,
        listingId,
        syncType: BnhubOtaSyncType.EXPORT,
        status: BnhubOtaSyncResultStatus.FAILED,
        message: msg,
      });
    }
  }
}

function mapExternalSourceLabel(label: string | undefined): BnhubBookingSource {
  const s = (label ?? "").toLowerCase();
  if (s.includes("airbnb")) return BnhubBookingSource.AIRBNB;
  if (s.includes("booking")) return BnhubBookingSource.BOOKING_COM;
  if (s.includes("vrbo")) return BnhubBookingSource.OTHER;
  if (s.includes("expedia")) return BnhubBookingSource.EXPEDIA;
  return BnhubBookingSource.OTHER;
}

/** Host-owned manual reservation import (settlements handled off BNHub — payment row marked completed for accounting only). */
export async function importExternalChannelBooking(input: {
  actorHostUserId: string;
  listingId: string;
  checkInIso: string;
  checkOutIso: string;
  externalSource?: string;
  guestDisplayName?: string;
}): Promise<{ bookingId: string }> {
  const listing = await prisma.shortTermListing.findFirst({
    where: { id: input.listingId, ownerId: input.actorHostUserId },
    select: { id: true, ownerId: true },
  });
  if (!listing) {
    throw new Error("Listing not found or access denied");
  }

  const checkIn = new Date(input.checkInIso);
  const checkOut = new Date(input.checkOutIso);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || !(checkIn < checkOut)) {
    throw new Error("Invalid check-in / check-out");
  }

  const placeholderGuestId = await ensureBnhubChannelPlaceholderGuest();
  const pricing = await import("@/lib/bnhub/booking-pricing").then((m) =>
    m.computeBookingPricing({
      listingId: input.listingId,
      checkIn: input.checkInIso,
      checkOut: input.checkOutIso,
      guestCount: 1,
      guestUserId: placeholderGuestId,
    })
  );
  if (!pricing) {
    throw new Error("Could not compute pricing for import");
  }

  const { breakdown: b } = pricing;
  const bookingSource = mapExternalSourceLabel(input.externalSource);

  const { allocateUniqueConfirmationCode } = await import("@/lib/bnhub/confirmation-code");
  const confirmationCode = await allocateUniqueConfirmationCode();

  const bookingId = await prisma.$transaction(async (tx) => {
    const { expireStaleBnhubPendingBookings, findOverlappingActiveBnhubBooking } = await import(
      "@/lib/bookings/checkAvailability"
    );
    const { utcDayStart } = await import("@/lib/bnhub/availability-day-helpers");
    const { upsertBookedNightsForBooking } = await import("@/lib/bnhub/availability-day-helpers");
    const { generateBookingCode } = await import("@/lib/codes/generate-code");

    await expireStaleBnhubPendingBookings(tx, input.listingId);
    const overlap = await findOverlappingActiveBnhubBooking(tx, input.listingId, checkIn, checkOut);
    if (overlap) {
      throw new Error("CONFLICT");
    }

    const rangeStart = utcDayStart(checkIn);
    const rangeEnd = utcDayStart(checkOut);
    const blockedSlot = await tx.availabilitySlot.findFirst({
      where: {
        listingId: input.listingId,
        date: { gte: rangeStart, lt: rangeEnd },
        OR: [{ available: false }, { dayStatus: { in: ["BLOCKED", "BOOKED"] } }],
      },
    });
    if (blockedSlot) {
      throw new Error("CONFLICT");
    }

    const bookingCode = await generateBookingCode(tx);

    const priceSnapshotSubtotalCents =
      b.lodgingSubtotalAfterDiscountCents + b.cleaningFeeCents + b.addonsSubtotalCents;
    const created = await tx.booking.create({
      data: {
        listingId: input.listingId,
        guestId: placeholderGuestId,
        bookingSource,
        checkIn,
        checkOut,
        nights: b.nights,
        totalCents: b.subtotalCents,
        guestFeeCents: b.serviceFeeCents,
        hostFeeCents: b.hostFeeCents,
        priceSnapshotSubtotalCents,
        priceSnapshotFeesCents: b.serviceFeeCents,
        priceSnapshotTaxesCents: b.taxCents,
        priceSnapshotTotalCents: b.totalCents,
        status: BookingStatus.CONFIRMED,
        guestNotes: null,
        specialRequest: `Channel import (${input.externalSource ?? "external"}). Collected off-platform.`,
        confirmationCode,
        bookingCode,
        guestsCount: 1,
        guestContactName: input.guestDisplayName?.trim() || null,
        guestContactEmail: null,
        pendingCheckoutExpiresAt: null,
      },
    });

    await tx.payment.create({
      data: {
        bookingId: created.id,
        amountCents: b.totalCents,
        guestFeeCents: b.serviceFeeCents,
        hostFeeCents: b.hostFeeCents + b.addonsHostFeeCents,
        hostPayoutCents: b.hostPayoutCents,
        status: "COMPLETED",
        hostPayoutReleasedAt: null,
        payoutHoldReason: "channel_import_off_platform",
      },
    });

    await upsertBookedNightsForBooking(tx, {
      listingId: input.listingId,
      checkIn,
      checkOut,
      bookingId: created.id,
    });

    return created.id;
  });

  void syncAvailability(input.listingId).catch(() => {});

  const { scheduleBookingRiskEvaluation } = await import("@/modules/risk-engine/risk-prevention.service");
  scheduleBookingRiskEvaluation(bookingId);

  return { bookingId };
}
