import {
  BookingStatus,
  BnhubBookingServiceLineStatus,
  BnhubBookingSource,
  BnhubServiceSelectedFrom,
  ListingStatus,
  ManualPaymentSettlement,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import { assertHostAgreementSignedForPublish } from "@/lib/contracts/bnhub-host-contracts";
import { contractEnforcementDisabled } from "@/lib/contracts/enforcement-flags";
import { allocateUniqueConfirmationCode } from "@/lib/bnhub/confirmation-code";
import { generateBookingCode } from "@/lib/codes/generate-code";
import { computeBookingPricing } from "./booking-pricing";
import type { SelectedAddonInput } from "./hospitality-addons";
import { triggerNewBooking, triggerBookingConfirmation, triggerBookingCancellation, triggerReviewReminder } from "./notifications";
import { getEscrowReleaseHoursAfterCheckin } from "@/lib/trust-safety/constants";
import { recomputeGuestTrustMetrics, syncListingBnhubTrustSnapshot } from "@/lib/bnhub/two-sided-trust-sync";
import { generateBookingConfirmationDraft } from "@/lib/document-drafting/generators/booking-confirmation";
import { saveBookingAgreement } from "@/lib/agreements/platform-agreements";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { assertGuestShortTermBookingAllowed } from "@/modules/legal/assert-legal";
import {
  releaseBookedSlotsForBooking,
  upsertBookedNightsForBooking,
  utcDayStart,
} from "./availability-day-helpers";
import { syncTrustGraphOnBookingCreated } from "@/lib/trustgraph/application/integrations/bnHubBookingIntegration";
import { runBnhubPostBookingPaidAutomation, runBnhubStayCompletedAutomation } from "@/lib/bnhub/revenue-automation";
import { evaluateListingForNewBooking } from "@/lib/bnhub/bnhub-safety-rules";
import { onGrowthAiCheckoutCompleted } from "@/src/modules/messaging/triggers";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";
import { assertGuestIdentityAllowedForBooking } from "@/lib/bnhub/guest-identity-gate";
import { publishLecipmBookingEvent } from "@/lib/realtime/lecipm-booking-events";
import { enqueueHostAutopilot } from "@/lib/ai/autopilot/triggers";
import { getResolvedMarket } from "@/lib/markets";
import { normalizeLocaleCode, translateServer } from "@/lib/i18n/server-translate";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { recordLecipmManagerGrowthEvent } from "@/lib/growth/manager-events";
import { expireStaleBnhubPendingBookings } from "@/lib/bookings/checkAvailability";
import { assertInventoryAvailableForNewStay, isBookingHoldActive } from "@/modules/bookings/availability.service";
import { validateBookingHoldByBlockId } from "@/modules/bookings/booking-hold.service";
import { logGuestExperienceOutcome } from "@/lib/bnhub/guest-experience/log-signal";
import { resolveBnhubPlatformGuestFeePercent } from "@/lib/bnhub/booking-revenue-pricing";
import { calculateTrustScore, flagBnhubUserTrustForReview } from "@/modules/trust/trust.engine";

const HOST_FEE_PERCENT = 3;

/** Legacy fee calculation (used when pricing engine not needed). */
export function calculateFees(nightPriceCents: number, nights: number) {
  const guestPct = resolveBnhubPlatformGuestFeePercent();
  const totalCents = nightPriceCents * nights;
  const guestFeeCents = Math.round((totalCents * guestPct) / 100);
  const hostFeeCents = Math.round((totalCents * HOST_FEE_PERCENT) / 100);
  const hostPayoutCents = totalCents - hostFeeCents;
  const guestTotalCents = totalCents + guestFeeCents;
  return {
    totalCents,
    guestFeeCents,
    hostFeeCents,
    hostPayoutCents,
    guestTotalCents,
    nights,
  };
}

async function appendManualPaymentAudit(
  tx: Prisma.TransactionClient,
  input: {
    bookingId: string;
    actorUserId: string | null;
    from: ManualPaymentSettlement;
    to: ManualPaymentSettlement;
    note?: string | null;
  }
) {
  await tx.bookingManualPaymentEvent.create({
    data: {
      bookingId: input.bookingId,
      actorUserId: input.actorUserId,
      fromSettlement: input.from,
      toSettlement: input.to,
      note: input.note ?? null,
    },
  });
}

async function recordBookingEvent(
  bookingId: string,
  eventType: string,
  actorId: string | null,
  payload?: Record<string, unknown>
) {
  await prisma.bnhubBookingEvent.create({
    data: {
      bookingId,
      eventType,
      actorId,
      payload: payload ? (payload as Prisma.InputJsonValue) : undefined,
    },
  });
}

/**
 * Create a booking. Uses full pricing engine (nightly, cleaning, tax, fees).
 * If listing has instantBookEnabled: status PENDING (guest pays to confirm).
 * If not: status AWAITING_HOST_APPROVAL (host must approve, then guest pays).
 */
export async function createBooking(data: {
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guestCount?: number;
  guestContactEmail?: string;
  guestContactName?: string;
  guestContactPhone?: string;
  /** Optional hospitality add-ons (validated server-side against listing offers). */
  selectedAddons?: SelectedAddonInput[];
  guestNotes?: string;
  /** Optional guest asks (pickup, etc.) — persisted on booking; falls back to guestNotes when omitted. */
  specialRequest?: string;
  /** Structured requests (airport pickup, parking, shuttle, extras). */
  specialRequestsJson?: Record<string, unknown> | null;
  /**
   * If set, consumes a `BOOKING_HOLD` `AvailabilityBlock` created by `createBookingHold`.
   * Must match listing and stay dates (validated before the inventory transaction).
   */
  releaseAvailabilityBlockId?: string;
}) {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights < 1) throw new Error("Invalid dates");

  const listing = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: data.listingId },
    include: { owner: { select: { id: true, accountStatus: true } } },
  });

  const fraudRow = await prisma.propertyFraudScore.findUnique({
    where: { listingId: data.listingId },
    select: { fraudScore: true, riskLevel: true },
  });
  const safety = evaluateListingForNewBooking(listing, fraudRow);
  if (!safety.ok && safety.blockReason) {
    throw new Error(safety.blockReason);
  }

  const blockedStatuses = ["UNDER_INVESTIGATION", "FROZEN", "REJECTED_FOR_FRAUD", "PERMANENTLY_REMOVED", "SUSPENDED"];
  if (listing.listingStatus && blockedStatuses.includes(listing.listingStatus)) {
    throw new Error("This listing is not available for booking");
  }
  if (listing.owner?.accountStatus && listing.owner.accountStatus !== "ACTIVE") {
    throw new Error("Bookings are not available for this listing");
  }

  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    throw new Error("This listing is not available for booking.");
  }

  if (listing.minStayNights != null && nights < listing.minStayNights) {
    throw new Error(`Minimum stay is ${listing.minStayNights} nights`);
  }
  if (listing.maxStayNights != null && nights > listing.maxStayNights) {
    throw new Error(`Maximum stay is ${listing.maxStayNights} nights`);
  }

  if (!contractEnforcementDisabled()) {
    const hostGate = await assertHostAgreementSignedForPublish(data.listingId);
    if (!hostGate.ok) {
      throw new Error(hostGate.reasons[0] ?? "Host agreement required before bookings are accepted.");
    }
  }

  if (!legalEnforcementDisabled()) {
    const guestLegal = await assertGuestShortTermBookingAllowed(data.guestId, data.listingId);
    if (!guestLegal.ok) {
      throw new Error(guestLegal.blockingReasons[0] ?? "Guest acknowledgment required before booking.");
    }
  }

  const pricing = await computeBookingPricing({
    listingId: data.listingId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    guestCount: data.guestCount,
    selectedAddons: data.selectedAddons,
    guestUserId: data.guestId,
  });
  if (!pricing) throw new Error("Could not compute pricing");
  const b = pricing.breakdown;

  await assertGuestIdentityAllowedForBooking({
    prismaListingId: data.listingId,
    guestTotalUsd: b.totalCents / 100,
    prismaGuestUserId: data.guestId,
  });

  const guestTrust = await calculateTrustScore({
    userId: data.guestId,
    listingId: data.listingId,
    pendingBookingTotalCents: b.totalCents,
  });

  await prisma.bnhubGuestProfile.upsert({
    where: { userId: data.guestId },
    create: { userId: data.guestId, trustScore: guestTrust.score },
    update: { trustScore: guestTrust.score },
  });

  if (guestTrust.hostScore != null) {
    await prisma.bnhubHostProfile.upsert({
      where: { userId: data.guestId },
      create: { userId: data.guestId, trustScore: guestTrust.hostScore },
      update: { trustScore: guestTrust.hostScore },
    });
  }

  try {
    await flagBnhubUserTrustForReview({
      userId: data.guestId,
      listingId: data.listingId,
      trust: guestTrust,
    });
  } catch (err) {
    logWarn("[trust] bnhub_trust_review_flag_failed", { domain: "[trust]", err });
  }

  const market = await getResolvedMarket();
  const requestOnly =
    !market.onlinePaymentsEnabled || market.bookingMode === "manual_first";
  const trustForceHostApproval =
    guestTrust.riskLevel === "HIGH" && process.env.BNHUB_TRUST_HIGH_RISK_FORCE_HOST_APPROVAL === "1";

  let initialStatus: BookingStatus = requestOnly
    ? BookingStatus.AWAITING_HOST_APPROVAL
    : listing.instantBookEnabled
      ? BookingStatus.PENDING
      : BookingStatus.AWAITING_HOST_APPROVAL;

  if (trustForceHostApproval) {
    initialStatus = BookingStatus.AWAITING_HOST_APPROVAL;
  }
  const confirmationCode = await allocateUniqueConfirmationCode();

  const escrowHours = getEscrowReleaseHoursAfterCheckin();
  const escrowReleaseAt = new Date(checkIn.getTime() + escrowHours * 60 * 60 * 1000);

  const guestCountResolved =
    typeof data.guestCount === "number" && data.guestCount > 0
      ? Math.min(50, Math.max(1, Math.floor(data.guestCount)))
      : undefined;
  if (guestCountResolved != null && guestCountResolved > listing.maxGuests) {
    throw new Error(`This listing allows at most ${listing.maxGuests} guests.`);
  }

  const pendingExpiresAt =
    initialStatus === BookingStatus.PENDING ? new Date(Date.now() + 60 * 60 * 1000) : null;

  if (data.releaseAvailabilityBlockId?.trim()) {
    const h = await prisma.availabilityBlock.findUnique({
      where: { id: data.releaseAvailabilityBlockId.trim() },
      select: { id: true, listingId: true, startDate: true, endDate: true, blockType: true, reason: true },
    });
    if (!h || h.blockType !== "BOOKING_HOLD" || h.listingId !== data.listingId) {
      throw new Error("Invalid or expired hold. Refresh dates and try again.");
    }
    if (!isBookingHoldActive(h.reason)) {
      throw new Error("Hold expired. Check availability and try again.");
    }
    const wantIn = utcDayStart(checkIn).getTime();
    const wantOut = utcDayStart(checkOut).getTime();
    if (h.startDate.getTime() !== wantIn || h.endDate.getTime() !== wantOut) {
      throw new Error("Hold does not match selected dates.");
    }
  }

  const booking = await prisma.$transaction(
    async (tx) => {
      if (data.releaseAvailabilityBlockId?.trim()) {
        const v = await validateBookingHoldByBlockId(tx, data.releaseAvailabilityBlockId.trim());
        if (!v) {
          throw new Error("Hold was released or expired. Try again.");
        }
      }
      await expireStaleBnhubPendingBookings(tx, data.listingId);
      await assertInventoryAvailableForNewStay(tx, {
        listingId: data.listingId,
        checkIn,
        checkOut,
        ignoreAvailabilityBlockId: data.releaseAvailabilityBlockId?.trim() || undefined,
      });

      const bookingCode = await generateBookingCode(tx);
      const priceSnapshotSubtotalCents =
        b.lodgingSubtotalAfterDiscountCents + b.cleaningFeeCents + b.addonsSubtotalCents;
      const created = await tx.booking.create({
        data: {
          listingId: data.listingId,
          guestId: data.guestId,
          bookingSource: BnhubBookingSource.LOCAL,
          checkIn,
          checkOut,
          nights,
          totalCents: b.subtotalCents,
          guestFeeCents: b.serviceFeeCents,
          hostFeeCents: b.hostFeeCents,
          priceSnapshotSubtotalCents,
          priceSnapshotFeesCents: b.serviceFeeCents,
          priceSnapshotTaxesCents: b.taxCents,
          priceSnapshotTotalCents: b.totalCents,
          status: initialStatus,
          guestNotes: data.guestNotes,
          specialRequest: data.specialRequest ?? data.guestNotes,
          specialRequestsJson: (data.specialRequestsJson ?? undefined) as Prisma.InputJsonValue | undefined,
          confirmationCode,
          bookingCode,
          guestsCount: guestCountResolved ?? null,
          guestContactEmail: data.guestContactEmail?.trim() || null,
          guestContactName: data.guestContactName?.trim() || null,
          guestContactPhone: data.guestContactPhone?.trim() || null,
          pendingCheckoutExpiresAt: pendingExpiresAt,
        },
      });

      await tx.bnhubBookingEvent.create({
        data: {
          bookingId: created.id,
          eventType: "availability_checked",
          actorId: data.guestId,
          payload: {
            listingId: data.listingId,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await tx.bnhubBookingEvent.create({
        data: {
          bookingId: created.id,
          eventType: "guest_trust_evaluated",
          actorId: data.guestId,
          payload: {
            score: guestTrust.score,
            riskLevel: guestTrust.riskLevel,
            uiLabel: guestTrust.uiLabel,
            fraudSignalCodes: guestTrust.fraudSignalCodes,
            factorCount: guestTrust.factors.length,
            hostScore: guestTrust.hostScore,
          } as Prisma.InputJsonValue,
        },
      });

      await tx.payment.create({
        data: {
          bookingId: created.id,
          amountCents: b.totalCents,
          guestFeeCents: b.serviceFeeCents,
          hostFeeCents: b.hostFeeCents + b.addonsHostFeeCents,
          hostPayoutCents: b.hostPayoutCents,
          status: "PENDING",
          hostPayoutReleasedAt: escrowReleaseAt,
          payoutHoldReason: "escrow_window",
        },
      });

      for (const line of b.addonLines) {
        const lineStatus = line.quoteRequired
          ? BnhubBookingServiceLineStatus.REQUESTED
          : line.requiresApproval
            ? BnhubBookingServiceLineStatus.PENDING_APPROVAL
            : BnhubBookingServiceLineStatus.CONFIRMED;
        await tx.bnhubBookingService.create({
          data: {
            bookingId: created.id,
            listingId: data.listingId,
            guestUserId: data.guestId,
            hostUserId: listing.ownerId,
            listingServiceId: line.listingServiceId,
            serviceId: line.serviceId,
            quantity: line.quantity,
            linePricingType: line.pricingType,
            unitPriceCents: line.unitPriceCents,
            totalPriceCents: line.totalPriceCents,
            status: lineStatus,
            selectedFrom: BnhubServiceSelectedFrom.BOOKING_FLOW,
          },
        });
      }

      await upsertBookedNightsForBooking(tx, {
        listingId: data.listingId,
        checkIn,
        checkOut,
        bookingId: created.id,
      });

      if (data.releaseAvailabilityBlockId?.trim()) {
        await tx.availabilityBlock
          .delete({ where: { id: data.releaseAvailabilityBlockId.trim() } })
          .catch(() => {});
      }

      return created;
    },
    {
      maxWait: 5000,
      timeout: 20000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  void import("@/modules/pricing/pricing-engine.service")
    .then((m) => m.generatePricing(data.listingId))
    .catch(() => {});

  void import("@/lib/fraud/compute-booking-risk")
    .then((m) =>
      m.evaluateBookingFraudAfterCreate({
        bookingId: booking.id,
        guestId: data.guestId,
        listingId: data.listingId,
      })
    )
    .catch(() => {});

  await recordBookingEvent(
    booking.id,
    initialStatus === BookingStatus.PENDING ? "created" : "awaiting_host_approval",
    data.guestId,
    {
      nights: b.nights,
      totalCents: b.totalCents,
      addonsSubtotalCents: b.addonsSubtotalCents,
    }
  );

  void triggerNewBooking({
    bookingId: booking.id,
    listingId: data.listingId,
    guestId: data.guestId,
    hostId: listing.ownerId,
  });

  void syncTrustGraphOnBookingCreated({ bookingId: booking.id }).catch(() => {});

  void import("@/lib/quality/schedule-listing-quality")
    .then((m) => m.scheduleListingQualityRecompute(data.listingId))
    .catch(() => {});

  {
    const guestName =
      (await prisma.user.findUnique({ where: { id: data.guestId }, select: { name: true } }))?.name?.trim() ??
      "Guest";
    const hostLocaleRow = await prisma.user.findUnique({
      where: { id: listing.ownerId },
      select: { preferredUiLocale: true },
    });
    const hostLocale = normalizeLocaleCode(hostLocaleRow?.preferredUiLocale);
    const title =
      initialStatus === BookingStatus.PENDING
        ? translateServer(hostLocale, "host.newBookingPaymentPending")
        : translateServer(hostLocale, "host.newBookingReceived");
    let message = translateServer(hostLocale, "host.bookingMessage", {
      guestName,
      listingTitle: listing.title.slice(0, 80),
    });
    if (guestTrust.riskLevel === "HIGH") {
      message +=
        " Trust notice: elevated automated risk signals on this guest account — review before accepting (no automatic block).";
    } else if (guestTrust.riskLevel === "MEDIUM") {
      message += " Trust notice: guest trust is mid-range; use normal diligence.";
    }
    void createBnhubMobileNotification({
      userId: listing.ownerId,
      type: NotificationType.SYSTEM,
      title,
      message,
      actionUrl: `/bnhub/booking/${booking.id}`,
      actionLabel: translateServer(hostLocale, "host.viewReservation"),
      actorId: data.guestId,
      listingId: data.listingId,
      metadata: {
        bookingId: booking.id,
        listingId: data.listingId,
        guestTrustRisk: guestTrust.riskLevel,
        guestTrustUiLabel: guestTrust.uiLabel,
        guestTrustScore: guestTrust.score,
      } as Prisma.InputJsonValue,
      pushData: {
        kind: "new_booking_host",
        bookingId: booking.id,
        listingId: data.listingId,
      },
    }).catch(() => {});
  }

  void publishLecipmBookingEvent({
    event: "new_booking",
    bookingId: booking.id,
    hostId: listing.ownerId,
    guestId: data.guestId,
    listingId: data.listingId,
    status: initialStatus,
  });
  void publishLecipmBookingEvent({
    event: "booking_created",
    bookingId: booking.id,
    hostId: listing.ownerId,
    guestId: data.guestId,
    listingId: data.listingId,
    status: initialStatus,
  });

  enqueueHostAutopilot(listing.ownerId, {
    type: "booking_created",
    bookingId: booking.id,
    listingId: data.listingId,
    guestId: data.guestId,
  });

  void (async () => {
    const priorCompleted = await prisma.booking.count({
      where: {
        guestId: data.guestId,
        status: "COMPLETED",
        id: { not: booking.id },
      },
    });
    if (priorCompleted > 0) {
      await logGuestExperienceOutcome({
        hostId: listing.ownerId,
        listingId: data.listingId,
        bookingId: booking.id,
        guestId: data.guestId,
        outcomeType: "repeat_visit",
        metadata: { priorCompletedStays: priorCompleted },
      });
    }
  })().catch(() => {});

  // Auto-generate and save booking agreement to DB
  try {
    const draft = await generateBookingConfirmationDraft(booking.id);
    await saveBookingAgreement({
      bookingId: booking.id,
      version: "1.0",
      contentHtml: draft.html,
      metadata: {
        guestId: data.guestId,
        hostId: listing.ownerId,
        listingId: data.listingId,
      },
    });
  } catch (e) {
    console.warn("[booking] Failed to generate/save booking agreement:", e);
  }

  // Unified contract record for dashboard/legal
  try {
    const { createBookingContract } = await import("@/lib/hubs/contracts");
    await createBookingContract({
      bookingId: booking.id,
      userId: data.guestId,
      listingId: data.listingId,
      hub: "bnhub",
      content: { bookingId: booking.id, checkIn: data.checkIn, checkOut: data.checkOut },
    });
  } catch (e) {
    console.warn("[booking] Failed to create booking contract record:", e);
  }

  return prisma.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: {
      listing: true,
      guest: { select: { id: true, name: true, email: true } },
      payment: true,
    },
  });
}

export async function getBookingsForGuest(guestId: string) {
  return prisma.booking.findMany({
    where: { guestId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          photos: true,
          listingPhotos: true,
          nightPriceCents: true,
          listingStatus: true,
        },
      },
      payment: true,
      bnhubReservationPayment: true,
      review: true,
    },
    orderBy: { checkIn: "desc" },
  });
}

export async function getBookingsForHost(ownerId: string) {
  return prisma.booking.findMany({
    where: { listing: { ownerId } },
    include: {
      listing: { select: { id: true, title: true, city: true, listingCode: true } },
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
          homeCity: true,
          homeRegion: true,
          homeCountry: true,
        },
      },
      payment: true,
      bnhubReservationPayment: true,
    },
    orderBy: { checkIn: "desc" },
  });
}

/** Confirm booking after payment (sets CONFIRMED, payment COMPLETED). */
export async function confirmBooking(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (booking.status !== "PENDING" && booking.status !== "AWAITING_HOST_APPROVAL") {
    throw new Error("Booking cannot be confirmed in current state");
  }
  await prisma.payment.update({
    where: { bookingId },
    data: { status: "COMPLETED" },
  });
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
    include: { listing: true, guest: true, payment: true },
  });
  await recordBookingEvent(bookingId, "confirmed", null, { via: "payment" });

  try {
    const { holdPaymentInEscrow } = await import("@/src/modules/bnhub/application/paymentService");
    await holdPaymentInEscrow(bookingId);
  } catch (e) {
    console.warn("[booking] escrow hold after confirm:", e);
  }

  void triggerBookingConfirmation({
    bookingId,
    guestId: updated.guestId,
    hostId: updated.listing.ownerId,
  });

  void import("@/lib/ai/messaging/engine")
    .then(({ runHostLifecycleMessage }) =>
      runHostLifecycleMessage({ bookingId, trigger: "booking_confirmed" })
    )
    .catch(() => {});

  void onGrowthAiCheckoutCompleted(updated.guestId).catch(() => {});

  void createBnhubMobileNotification({
    userId: updated.listing.ownerId,
    type: NotificationType.SYSTEM,
    title: "Payment received — booking confirmed",
    message: `Payment for “${updated.listing.title.slice(0, 80)}” is complete.`,
    actionUrl: `/bnhub/booking/${bookingId}`,
    actionLabel: "View booking",
    actorId: updated.guestId,
    listingId: updated.listingId,
    metadata: { bookingId, listingId: updated.listingId } as Prisma.InputJsonValue,
    pushData: {
      kind: "booking_confirmation_host",
      bookingId,
      listingId: updated.listingId,
    },
  }).catch(() => {});

  void createBnhubMobileNotification({
    userId: updated.guestId,
    type: NotificationType.SYSTEM,
    title: "Booking confirmed",
    message: `Your stay at “${updated.listing.title.slice(0, 80)}” is confirmed.`,
    actionUrl: `/bnhub/booking/${bookingId}`,
    actionLabel: "View trip",
    listingId: updated.listingId,
    metadata: { bookingId } as Prisma.InputJsonValue,
    pushData: {
      kind: "booking_confirmation_guest",
      bookingId,
      listingId: updated.listingId,
    },
  }).catch(() => {});

  void runBnhubPostBookingPaidAutomation(bookingId).catch(() => {});

  void publishLecipmBookingEvent({
    event: "booking_confirmed",
    bookingId,
    hostId: updated.listing.ownerId,
    guestId: updated.guestId,
    listingId: updated.listingId,
    status: "CONFIRMED",
  });
  void publishLecipmBookingEvent({
    event: "booking_update",
    bookingId,
    hostId: updated.listing.ownerId,
    guestId: updated.guestId,
    listingId: updated.listingId,
    status: "CONFIRMED",
  });

  return updated;
}

/**
 * Host/admin confirms a booking after offline/manual payment (Syria-style markets).
 * Does not create Stripe charges; mirrors post-confirmation side effects of `confirmBooking`.
 */
export async function confirmBookingManualSettlement(bookingId: string, actorUserId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true, guest: true, payment: true },
  });
  const hostOk = booking.listing.ownerId === actorUserId;
  const adminOk = !hostOk && (await isPlatformAdmin(actorUserId));
  if (!hostOk && !adminOk) {
    throw new Error("Only the host or an admin can confirm manual payment");
  }
  if (booking.status !== "PENDING") {
    throw new Error("Booking cannot be confirmed manually in current state");
  }
  if (booking.manualPaymentSettlement !== "PENDING") {
    throw new Error("Manual payment is not pending for this booking");
  }

  const fromSettlement = booking.manualPaymentSettlement;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { bookingId },
      data: { status: "COMPLETED" },
    });
    const row = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        manualPaymentSettlement: "RECEIVED",
        manualPaymentUpdatedAt: new Date(),
        manualPaymentUpdatedByUserId: actorUserId,
      },
      include: { listing: true, guest: true, payment: true },
    });
    await appendManualPaymentAudit(tx, {
      bookingId,
      actorUserId,
      from: fromSettlement,
      to: "RECEIVED",
    });
    return row;
  });

  await recordBookingEvent(bookingId, "confirmed", actorUserId, { via: "manual_settlement" });

  try {
    const { holdPaymentInEscrow } = await import("@/src/modules/bnhub/application/paymentService");
    await holdPaymentInEscrow(bookingId);
  } catch (e) {
    console.warn("[booking] escrow hold after manual confirm:", e);
  }

  void triggerBookingConfirmation({
    bookingId,
    guestId: updated.guestId,
    hostId: updated.listing.ownerId,
  });

  void import("@/lib/ai/messaging/engine")
    .then(({ runHostLifecycleMessage }) =>
      runHostLifecycleMessage({ bookingId, trigger: "booking_confirmed" })
    )
    .catch(() => {});

  void onGrowthAiCheckoutCompleted(updated.guestId).catch(() => {});

  const hostLocale = normalizeLocaleCode(
    (await prisma.user.findUnique({
      where: { id: updated.listing.ownerId },
      select: { preferredUiLocale: true },
    }))?.preferredUiLocale,
  );
  const guestLocale = normalizeLocaleCode(
    (await prisma.user.findUnique({
      where: { id: updated.guestId },
      select: { preferredUiLocale: true },
    }))?.preferredUiLocale,
  );

  void createBnhubMobileNotification({
    userId: updated.listing.ownerId,
    type: NotificationType.SYSTEM,
    title: translateServer(hostLocale, "host.paymentReceivedConfirmed"),
    message: translateServer(hostLocale, "host.paymentMessage", {
      listingTitle: updated.listing.title.slice(0, 80),
    }),
    actionUrl: `/bnhub/booking/${bookingId}`,
    actionLabel: translateServer(hostLocale, "host.viewBooking"),
    actorId: updated.guestId,
    listingId: updated.listingId,
    metadata: { bookingId, listingId: updated.listingId } as Prisma.InputJsonValue,
    pushData: {
      kind: "booking_confirmation_host",
      bookingId,
      listingId: updated.listingId,
    },
  }).catch(() => {});

  void createBnhubMobileNotification({
    userId: updated.guestId,
    type: NotificationType.SYSTEM,
    title: translateServer(guestLocale, "host.guestBookingConfirmed"),
    message: translateServer(guestLocale, "host.guestStayConfirmed", {
      listingTitle: updated.listing.title.slice(0, 80),
    }),
    actionUrl: `/bnhub/booking/${bookingId}`,
    actionLabel: translateServer(guestLocale, "host.viewTrip"),
    listingId: updated.listingId,
    metadata: { bookingId } as Prisma.InputJsonValue,
    pushData: {
      kind: "booking_confirmation_guest",
      bookingId,
      listingId: updated.listingId,
    },
  }).catch(() => {});

  void runBnhubPostBookingPaidAutomation(bookingId).catch(() => {});

  void publishLecipmBookingEvent({
    event: "booking_confirmed",
    bookingId,
    hostId: updated.listing.ownerId,
    guestId: updated.guestId,
    listingId: updated.listingId,
    status: "CONFIRMED",
  });
  void publishLecipmBookingEvent({
    event: "booking_update",
    bookingId,
    hostId: updated.listing.ownerId,
    guestId: updated.guestId,
    listingId: updated.listingId,
    status: "CONFIRMED",
  });

  void getResolvedMarket()
    .then((m) =>
      recordLecipmManagerGrowthEvent("manual_payment_marked_received", {
        userId: actorUserId,
        listingId: updated.listingId,
        marketCode: m.code,
        metadata: { bookingId },
      }),
    )
    .catch(() => {});
  void recordLecipmManagerGrowthEvent("booking_confirmed", {
    userId: updated.guestId,
    listingId: updated.listingId,
    metadata: { bookingId, via: "manual_settlement" },
  });

  return updated;
}

export async function setManualPaymentFailed(bookingId: string, actorUserId: string, note?: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true },
  });
  const hostOk = booking.listing.ownerId === actorUserId;
  const adminOk = !hostOk && (await isPlatformAdmin(actorUserId));
  if (!hostOk && !adminOk) throw new Error("Only the host or an admin can update manual payment");
  if (booking.manualPaymentSettlement !== "PENDING") {
    throw new Error("Manual payment can only be marked failed while pending");
  }
  const fromSettlement = booking.manualPaymentSettlement;
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.booking.update({
      where: { id: bookingId },
      data: {
        manualPaymentSettlement: "FAILED",
        manualPaymentUpdatedAt: new Date(),
        manualPaymentUpdatedByUserId: actorUserId,
      },
      include: { listing: true, guest: true, payment: true },
    });
    await appendManualPaymentAudit(tx, {
      bookingId,
      actorUserId,
      from: fromSettlement,
      to: "FAILED",
      note: note ?? null,
    });
    return row;
  });
  await recordBookingEvent(bookingId, "manual_payment_failed", actorUserId, { note });
  return updated;
}

export async function resetManualPaymentPending(bookingId: string, actorUserId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true },
  });
  const hostOk = booking.listing.ownerId === actorUserId;
  const adminOk = !hostOk && (await isPlatformAdmin(actorUserId));
  if (!hostOk && !adminOk) throw new Error("Only the host or an admin can update manual payment");
  if (booking.manualPaymentSettlement !== "FAILED") {
    throw new Error("Manual payment can only be reset from failed state");
  }
  const fromSettlement = booking.manualPaymentSettlement;
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.booking.update({
      where: { id: bookingId },
      data: {
        manualPaymentSettlement: "PENDING",
        manualPaymentUpdatedAt: new Date(),
        manualPaymentUpdatedByUserId: actorUserId,
      },
      include: { listing: true, guest: true, payment: true },
    });
    await appendManualPaymentAudit(tx, {
      bookingId,
      actorUserId,
      from: fromSettlement,
      to: "PENDING",
    });
    return row;
  });
  await recordBookingEvent(bookingId, "manual_payment_reset_pending", actorUserId);
  return updated;
}

/** Host approves a booking request (guest can then pay). */
export async function approveBooking(bookingId: string, hostId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true, payment: true },
  });
  if (booking.listing.ownerId !== hostId) {
    throw new Error("Only the host can approve this booking");
  }
  if (booking.status !== "AWAITING_HOST_APPROVAL") {
    throw new Error("Booking is not awaiting host approval");
  }

  const market = await getResolvedMarket();
  const manualFirstPath =
    !market.onlinePaymentsEnabled &&
    market.manualPaymentTrackingEnabled &&
    market.bookingMode === "manual_first";

  if (manualFirstPath) {
    const fromSettlement = booking.manualPaymentSettlement;
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "PENDING",
          manualPaymentSettlement: "PENDING",
          manualPaymentUpdatedAt: new Date(),
          manualPaymentUpdatedByUserId: hostId,
        },
        include: { listing: true, guest: true, payment: true },
      });
      await appendManualPaymentAudit(tx, {
        bookingId,
        actorUserId: hostId,
        from: fromSettlement,
        to: "PENDING",
      });
      return row;
    });
    await recordBookingEvent(bookingId, "approved", hostId, { manualFirst: true });
    void publishLecipmBookingEvent({
      event: "booking_update",
      bookingId,
      hostId: updated.listing.ownerId,
      guestId: updated.guestId,
      listingId: updated.listingId,
      status: "PENDING",
    });
    return updated;
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "PENDING" },
    include: { listing: true, guest: true, payment: true },
  });
  await recordBookingEvent(bookingId, "approved", hostId);
  void publishLecipmBookingEvent({
    event: "booking_update",
    bookingId,
    hostId: updated.listing.ownerId,
    guestId: updated.guestId,
    listingId: updated.listingId,
    status: "PENDING",
  });
  return updated;
}

/** Host declines a booking request. */
export async function declineBooking(bookingId: string, hostId: string, reason?: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true },
  });
  if (booking.listing.ownerId !== hostId) {
    throw new Error("Only the host can decline this booking");
  }
  if (booking.status !== "AWAITING_HOST_APPROVAL") {
    throw new Error("Booking is not awaiting host approval");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "DECLINED" },
      include: { listing: true, guest: true, payment: true },
    });
    await releaseBookedSlotsForBooking(tx, bookingId);
    return row;
  });
  await recordBookingEvent(bookingId, "declined", hostId, { reason });
  return updated;
}

/** Cancel a booking (guest, host, or admin). */
export async function cancelBooking(
  bookingId: string,
  actorId: string,
  by: "guest" | "host" | "admin",
  options?: { reason?: string | null }
) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true, payment: true },
  });
  const status = booking.status;
  if (
    [
      "DECLINED",
      "CANCELLED",
      "CANCELLED_BY_GUEST",
      "CANCELLED_BY_HOST",
      "COMPLETED",
      "DISPUTED",
      "EXPIRED",
    ].includes(status)
  ) {
    throw new Error("Booking cannot be cancelled in current state");
  }
  const newStatus =
    by === "guest"
      ? "CANCELLED_BY_GUEST"
      : by === "host"
        ? "CANCELLED_BY_HOST"
        : "CANCELLED";
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        canceledAt: now,
        cancellationReason: options?.reason?.trim() || null,
      },
      include: { listing: true, guest: true, payment: true },
    });
    await releaseBookedSlotsForBooking(tx, bookingId);
    return row;
  });
  await recordBookingEvent(bookingId, "cancelled", actorId, { by, previousStatus: status });
  void recomputeGuestTrustMetrics(updated.guestId).catch(() => {});
  void syncListingBnhubTrustSnapshot(updated.listingId).catch(() => {});
  void triggerBookingCancellation({
    bookingId,
    guestId: updated.guestId,
    hostId: updated.listing.ownerId,
    cancelledBy: by,
  });
  const guestMessage =
    by === "guest"
      ? `You cancelled your stay at “${updated.listing.title.slice(0, 80)}”.`
      : `Your stay at “${updated.listing.title.slice(0, 80)}” was cancelled.`;
  void createBnhubMobileNotification({
    userId: updated.guestId,
    type: NotificationType.SYSTEM,
    title: "Booking cancelled",
    message: guestMessage,
    actionUrl: `/bnhub/booking/${bookingId}`,
    actionLabel: "View trip",
    listingId: updated.listingId,
    actorId,
    metadata: { bookingId, cancelledBy: by } as Prisma.InputJsonValue,
    pushData: {
      kind: "booking_cancellation",
      bookingId,
      cancelledBy: by,
      listingId: updated.listingId,
    },
  }).catch(() => {});
  return updated;
}

export async function completeBooking(bookingId: string) {
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED" },
    include: { listing: true, payment: true },
  });
  await recordBookingEvent(bookingId, "completed", null);
  void recomputeGuestTrustMetrics(updated.guestId).catch(() => {});
  void syncListingBnhubTrustSnapshot(updated.listingId).catch(() => {});
  void triggerReviewReminder({
    bookingId,
    guestId: updated.guestId,
    listingId: updated.listingId,
  });
  void runBnhubStayCompletedAutomation(bookingId, updated.guestId).catch(() => {});
  return updated;
}

export async function getBookingById(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guest: { select: { id: true, name: true, email: true } },
      payment: true,
      bnhubReservationPayment: {
        include: {
          paymentQuote: true,
        },
      },
      review: true,
      checkinDetails: true,
      bnhubInvoice: true,
      bnhubBookingServices: {
        include: { service: true, listingService: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
