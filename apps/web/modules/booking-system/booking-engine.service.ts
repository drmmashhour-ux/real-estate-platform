import { prisma } from "@/lib/db";
import { recordLeadFunnelEvent } from "@/modules/centris-conversion/lead-timeline.service";
import { sendBookingNotificationEmails } from "./booking-notification.service";

import type { BookVisitConfirmResult, LecipmVisitSourceTag } from "./booking.types";

/**
 * After user explicitly confirms — creates `LecipmVisit` and marks request accepted.
 * Does not run without `userConfirmed`.
 */
export async function confirmVisitBooking(input: {
  visitRequestId: string;
  userConfirmed: boolean;
  source: LecipmVisitSourceTag;
}): Promise<BookVisitConfirmResult> {
  if (!input.userConfirmed) {
    return { ok: false, error: "User confirmation required.", code: "validation" };
  }

  const req = await prisma.lecipmVisitRequest.findUnique({
    where: { id: input.visitRequestId },
    include: {
      lead: { select: { name: true, email: true, phone: true } },
      listing: { select: { title: true } },
      broker: { select: { name: true, email: true } },
    },
  });

  if (!req) {
    return { ok: false, error: "Visit request not found.", code: "not_found" };
  }

  if (req.status !== "pending") {
    return { ok: false, error: "Request is not pending.", code: "validation" };
  }

  if (req.holdExpiresAt && req.holdExpiresAt < new Date()) {
    return { ok: false, error: "Hold expired; pick a new time.", code: "conflict" };
  }

  try {
    const visit = await prisma.$transaction(async (tx) => {
      const sameBrokerVisit = await tx.lecipmVisit.findFirst({
        where: {
          brokerUserId: req.brokerUserId,
          status: "scheduled",
          startDateTime: { lt: req.requestedEnd },
          endDateTime: { gt: req.requestedStart },
        },
      });
      if (sameBrokerVisit) {
        throw new Error("CONFLICT_VISIT");
      }

      const pendingOverlap = await tx.lecipmVisitRequest.findFirst({
        where: {
          brokerUserId: req.brokerUserId,
          status: "pending",
          id: { not: req.id },
          OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gte: new Date() } }],
          AND: [
            { requestedStart: { lt: req.requestedEnd } },
            { requestedEnd: { gt: req.requestedStart } },
          ],
        },
      });
      if (pendingOverlap) {
        throw new Error("CONFLICT_PENDING");
      }

      const updated = await tx.lecipmVisitRequest.update({
        where: { id: req.id, status: "pending" },
        data: {
          status: "accepted",
          visitSource: input.source,
          holdExpiresAt: null,
          metadata: { confirmedAt: new Date().toISOString() },
        },
      });

      const v = await tx.lecipmVisit.create({
        data: {
          visitRequestId: updated.id,
          leadId: updated.leadId,
          listingId: updated.listingId,
          brokerUserId: updated.brokerUserId,
          customerUserId: updated.customerUserId,
          startDateTime: updated.requestedStart,
          endDateTime: updated.requestedEnd,
          status: "scheduled",
        },
      });

      await tx.lead.update({
        where: { id: updated.leadId },
        data: {
          lecipmCrmStage: "visit_scheduled",
          meetingAt: updated.requestedStart,
        },
      });

      return v;
    });

    void recordLeadFunnelEvent(req.leadId, "BOOKING", {
      channel: "LECIPM",
      lecipmVisitId: visit.id,
      visitRequestId: req.id,
      source: input.source,
    });

    void sendBookingNotificationEmails({
      leadName: req.lead.name,
      leadEmail: req.lead.email,
      listingTitle: req.listing.title,
      brokerEmail: req.broker.email,
      brokerName: req.broker.name,
      start: req.requestedStart,
    });

    const { initializeLecipmVisitNoShow } = await import("@/modules/no-show-prevention/no-show-confirmation.service");
    void initializeLecipmVisitNoShow(visit.id);

    return { ok: true, visitRequestId: req.id, visitId: visit.id };
  } catch (e) {
    const isConflict =
      e instanceof Error && (e.message === "CONFLICT_VISIT" || e.message === "CONFLICT_PENDING");
    if (isConflict) {
      return { ok: false, error: "Time no longer available.", code: "conflict" };
    }
    return { ok: false, error: "Could not complete booking. Try again.", code: "validation" };
  }
}

/** Reversible: cancels a pending hold (soft booking) with no `LecipmVisit` yet. */
export async function cancelPendingVisitRequest(input: { visitRequestId: string }): Promise<{ ok: boolean; error?: string }> {
  const res = await prisma.lecipmVisitRequest.updateMany({
    where: { id: input.visitRequestId, status: "pending" },
    data: { status: "cancelled", holdExpiresAt: null },
  });
  if (res.count === 0) {
    return { ok: false, error: "No pending request to cancel." };
  }
  return { ok: true };
}

/** Reversible: cancels a scheduled visit and frees the time (notifies in a future pass). */
export async function cancelScheduledVisit(input: { visitId: string; actorUserId: string; reason?: string }): Promise<{ ok: boolean; error?: string }> {
  void input.reason;
  const v = await prisma.lecipmVisit.findUnique({
    where: { id: input.visitId },
    select: { id: true, brokerUserId: true, leadId: true, status: true, visitRequestId: true },
  });
  if (!v || v.status !== "scheduled") {
    return { ok: false, error: "Visit not found or not scheduled." };
  }
  if (v.brokerUserId !== input.actorUserId) {
    const user = await prisma.user.findUnique({ where: { id: input.actorUserId }, select: { role: true } });
    if (user?.role === "ADMIN") {
      // proceed
    } else {
      const lead = await prisma.lead.findFirst({
        where: { id: v.leadId, userId: input.actorUserId },
        select: { id: true },
      });
      if (!lead) {
        return { ok: false, error: "Not allowed to cancel this visit." };
      }
    }
  }

  await prisma.$transaction([
    prisma.lecipmVisit.update({
      where: { id: v.id },
      data: { status: "cancelled" },
    }),
    prisma.lecipmVisitRequest.update({
      where: { id: v.visitRequestId },
      data: { status: "cancelled" },
    }),
  ]);
  return { ok: true };
}
