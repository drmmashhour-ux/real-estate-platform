import type { Booking, BookingIssue, BookingMessage, BnhubCheckinDetails, PrismaClient, Review } from "@prisma/client";
import { addDays, subDays } from "date-fns";
import { detectRisksForBooking } from "./risk-detection";
import { shouldSuppressRiskLog } from "./cooldown";
import type { BookingRiskContext } from "./types";
import { createNotification } from "@/modules/notifications/services/create-notification";
import { persistUnifiedBookingRiskAssessment } from "@/modules/risk-engine/risk-prevention.service";

function listingHasPhotosJson(photos: unknown): boolean {
  if (photos == null) return false;
  if (Array.isArray(photos)) return photos.length > 0;
  if (typeof photos === "string") {
    try {
      const p = JSON.parse(photos) as unknown;
      return Array.isArray(p) && p.length > 0;
    } catch {
      return false;
    }
  }
  return false;
}

function adequateCheckinDetails(c: BnhubCheckinDetails | null | undefined): boolean {
  if (!c) return false;
  const ins = c.instructions?.trim() ?? "";
  const key = c.keyInfo?.trim() ?? "";
  return ins.length > 0 || key.length > 0;
}

/** Exported for `@/modules/risk-engine` unified scoring. */
export function buildBnhubBookingRiskContext(input: {
  booking: Booking & {
    listing: {
      id: string;
      title: string;
      ownerId: string;
      verificationStatus: string;
      photos: unknown;
    };
    bookingIssues: Pick<BookingIssue, "status">[];
    bookingMessages: Pick<BookingMessage, "senderId" | "createdAt">[];
    checkinDetails: BnhubCheckinDetails | null;
    review: Pick<Review, "propertyRating" | "accuracyRating" | "amenitiesAsAdvertised"> | null;
  };
  listingOpenIssueCount90d: number;
  now: Date;
}): BookingRiskContext {
  const { booking, now } = input;
  const hostId = booking.listing.ownerId;
  const messages = [...booking.bookingMessages].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const last = messages[0];
  const hostLast = messages.find((m) => m.senderId === hostId)?.createdAt ?? null;
  const guestLast = messages.find((m) => m.senderId === booking.guestId)?.createdAt ?? null;

  const activeIssueCount = booking.bookingIssues.filter((i) => i.status !== "resolved").length;

  return {
    bookingId: booking.id,
    listingId: booking.listingId,
    listingTitle: booking.listing.title,
    status: booking.status,
    guestId: booking.guestId,
    hostId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    now,
    checkedInAt: booking.checkedInAt,
    checklistDeclaredByHostAt: booking.checklistDeclaredByHostAt,
    hasAdequateCheckinDetails: adequateCheckinDetails(input.booking.checkinDetails),
    hostLastMessageAt: hostLast,
    guestLastMessageAt: guestLast,
    lastMessageAt: last?.createdAt ?? null,
    lastMessageSenderId: last?.senderId ?? null,
    unresolvedIssueCount: booking.bookingIssues.filter((i) => i.status === "open" || i.status === "reviewing").length,
    activeIssueCount,
    listingOpenIssueCount90d: input.listingOpenIssueCount90d,
    review: input.booking.review
      ? {
          propertyRating: input.booking.review.propertyRating,
          accuracyRating: input.booking.review.accuracyRating,
          amenitiesAsAdvertised: input.booking.review.amenitiesAsAdvertised,
        }
      : null,
    listingVerificationStatus: booking.listing.verificationStatus,
    listingHasPhotos: listingHasPhotosJson(booking.listing.photos),
  };
}

/** Exported for unified pre-dispute risk engine (signals only — no legal findings). */
export async function listingOpenIssueCount90d(
  prisma: PrismaClient,
  listingId: string,
  now: Date
): Promise<number> {
  const since = subDays(now, 90);
  return prisma.bookingIssue.count({
    where: {
      booking: { listingId },
      status: { not: "resolved" },
      createdAt: { gte: since },
    },
  });
}

async function sendPreventionNotifications(input: {
  bookingId: string;
  listingId: string;
  hostId: string;
  guestId: string;
  risk: ReturnType<typeof detectRisksForBooking>[number];
}): Promise<boolean> {
  const url = `/bnhub/booking/${input.bookingId}`;
  const title = "BNHUB: potential issue — guidance only";
  const meta = {
    kind: "bnhub_dispute_prevention",
    bookingId: input.bookingId,
    signalType: input.risk.signalType,
    riskLevel: input.risk.riskLevel,
  } as const;

  if (input.risk.preventionAction === "GENTLE_REMINDER") {
    const target = input.risk.reminderTarget;
    if (target === "guest") {
      await createNotification({
        userId: input.guestId,
        type: "REMINDER",
        title,
        message: input.risk.messageDraftGuest ?? input.risk.summary,
        actionUrl: url,
        actionLabel: "Open booking",
        listingId: input.listingId,
        metadata: meta,
        skipIfDuplicateUnread: true,
      });
      return true;
    }
    if (target === "host") {
      await createNotification({
        userId: input.hostId,
        type: "REMINDER",
        title,
        message: input.risk.messageDraftHost ?? input.risk.summary,
        actionUrl: url,
        actionLabel: "Open booking",
        listingId: input.listingId,
        metadata: meta,
        skipIfDuplicateUnread: true,
      });
      return true;
    }
    return false;
  }

  if (input.risk.preventionAction === "NOTIFY_BOTH_PARTIES") {
    await createNotification({
      userId: input.hostId,
      type: "SYSTEM",
      title,
      message: input.risk.messageDraftHost ?? input.risk.summary,
      priority: "NORMAL",
      actionUrl: url,
      actionLabel: "Open booking",
      listingId: input.listingId,
      metadata: meta,
      skipIfDuplicateUnread: true,
    });
    await createNotification({
      userId: input.guestId,
      type: "SYSTEM",
      title,
      message: input.risk.messageDraftGuest ?? input.risk.summary,
      priority: "NORMAL",
      actionUrl: url,
      actionLabel: "Open booking",
      listingId: input.listingId,
      metadata: meta,
      skipIfDuplicateUnread: true,
    });
    return true;
  }

  if (input.risk.preventionAction === "NOTIFY_ADMIN_ESCALATION") {
    const adminUserId = process.env.DISPUTE_PREVENTION_ADMIN_USER_ID?.trim();
    if (adminUserId) {
      await createNotification({
        userId: adminUserId,
        type: "SYSTEM",
        title: "BNHUB: review suggested (risk signal)",
        message: `${input.risk.summary} — Booking ${input.bookingId}. Recommended: ${input.risk.recommendedAction}`,
        priority: "HIGH",
        actionUrl: `/admin/bnhub/dispute-prevention`,
        actionLabel: "Review queue",
        metadata: { ...meta, requiresAdminReview: true },
        skipIfDuplicateUnread: true,
      });
    }
    return Boolean(adminUserId);
  }

  return false;
}

export type RunBnhubDisputePreventionResult = {
  bookingsScanned: number;
  risksDetected: number;
  logsCreated: number;
  suppressed: number;
};

/**
 * Scans active BNHUB bookings, persists `AiDisputeRiskLog` rows, and queues neutral in-app reminders (no auto-resolution).
 */
export async function runBnhubDisputePreventionScan(
  prisma: PrismaClient,
  opts?: { limit?: number }
): Promise<RunBnhubDisputePreventionResult> {
  const now = new Date();
  const limit = opts?.limit ?? 400;
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        {
          status: { in: ["CONFIRMED", "AWAITING_HOST_APPROVAL", "DISPUTED"] },
          checkOut: { gte: subDays(now, 2) },
          checkIn: { lte: addDays(now, 60) },
        },
        {
          status: "COMPLETED",
          checkOut: { gte: subDays(now, 30) },
        },
      ],
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          verificationStatus: true,
          photos: true,
        },
      },
      bookingIssues: { select: { status: true } },
      bookingMessages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { senderId: true, createdAt: true },
      },
      checkinDetails: true,
      review: {
        select: {
          propertyRating: true,
          accuracyRating: true,
          amenitiesAsAdvertised: true,
        },
      },
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  let risksDetected = 0;
  let logsCreated = 0;
  let suppressed = 0;

  const listingCache = new Map<string, number>();
  for (const booking of bookings) {
    let li = listingCache.get(booking.listingId);
    if (li === undefined) {
      li = await listingOpenIssueCount90d(prisma, booking.listingId, now);
      listingCache.set(booking.listingId, li);
    }

    const ctx = buildBnhubBookingRiskContext({
      booking,
      listingOpenIssueCount90d: li,
      now,
    });
    const risks = detectRisksForBooking(ctx);
    for (const risk of risks) {
      risksDetected += 1;
      const skip = await shouldSuppressRiskLog({
        prisma,
        bookingId: booking.id,
        signalType: risk.signalType,
        newLevel: risk.riskLevel,
      });
      if (skip) {
        suppressed += 1;
        continue;
      }

      const requiresAdminReview = risk.riskLevel === "HIGH";
      const log = await prisma.aiDisputeRiskLog.create({
        data: {
          bookingId: booking.id,
          riskLevel: risk.riskLevel,
          signalType: risk.signalType,
          summary: risk.summary.slice(0, 500),
          recommendedAction: risk.recommendedAction,
          preventionAction: risk.preventionAction,
          messageDraftHost: risk.messageDraftHost,
          messageDraftGuest: risk.messageDraftGuest,
          actionTaken: "risk_detected",
          metadataJson: {
            ...(risk.metadata ?? {}),
            reminderTarget: risk.reminderTarget,
            escalation: requiresAdminReview
              ? {
                  bookingId: booking.id,
                  reason: risk.summary,
                  recommendedAction: risk.recommendedAction,
                }
              : undefined,
          },
          cooldownKey: risk.cooldownKey,
          requiresAdminReview,
        },
      });

      logsCreated += 1;

      let notified = false;
      try {
        notified = await sendPreventionNotifications({
          bookingId: booking.id,
          listingId: booking.listingId,
          hostId: booking.listing.ownerId,
          guestId: booking.guestId,
          risk,
        });
      } catch (e) {
        console.warn("[dispute-prevention] notification failed", e);
      }

      if (notified) {
        await prisma.aiDisputeRiskLog.update({
          where: { id: log.id },
          data: {
            notificationSentAt: new Date(),
            actionTaken: "risk_detected_notifications_queued",
          },
        });
      }
    }

    try {
      await persistUnifiedBookingRiskAssessment(booking.id);
    } catch (e) {
      console.warn("[risk] unified booking assessment failed", e);
    }
  }

  return {
    bookingsScanned: bookings.length,
    risksDetected,
    logsCreated,
    suppressed,
  };
}
