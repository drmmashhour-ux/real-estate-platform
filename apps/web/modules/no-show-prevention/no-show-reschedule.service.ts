import { prisma } from "@/lib/db";
import { reserveSlot } from "@/modules/booking-system/broker-availability.service";
import { confirmVisitBooking, cancelScheduledVisit } from "@/modules/booking-system/booking-engine.service";
import type { LecipmVisitSourceTag } from "@/modules/booking-system/booking.types";
import { recordLecipmNoShowEvent } from "./lecipm-noshow-timeline.service";
import type { RescheduleRequestResult } from "./no-show.types";

/**
 * Self-service reschedule: cancels the existing visit and books a new slot in one flow.
 * `userConfirmed` must be true on the final booking (no silent double-book).
 */
export async function rescheduleLecipmVisit(input: {
  visitId: string;
  start: Date;
  end: Date;
  userConfirmed: boolean;
  source: LecipmVisitSourceTag;
  actorUserId: string;
}): Promise<RescheduleRequestResult> {
  if (!input.userConfirmed) {
    return { ok: false, error: "Confirmation required.", code: "validation" };
  }
  const prev = await prisma.lecipmVisit.findUnique({
    where: { id: input.visitId },
    select: {
      id: true,
      leadId: true,
      listingId: true,
      brokerUserId: true,
      rescheduleCount: true,
      status: true,
    },
  });
  if (!prev || prev.status !== "scheduled") {
    return { ok: false, error: "Visit not found or not active.", code: "not_found" };
  }

  const cancel = await cancelScheduledVisit({ visitId: prev.id, actorUserId: input.actorUserId });
  if (!cancel.ok) {
    return { ok: false, error: cancel.error ?? "Could not cancel.", code: "forbidden" };
  }

  const hold = await reserveSlot({
    leadId: prev.leadId,
    listingId: prev.listingId,
    brokerId: prev.brokerUserId,
    start: input.start,
    end: input.end,
    visitSource: input.source,
    customerUserId: input.actorUserId,
  });
  if (!hold.ok) {
    return { ok: false, error: hold.error, code: "conflict" };
  }

  const confirmed = await confirmVisitBooking({
    visitRequestId: hold.visitRequestId,
    userConfirmed: true,
    source: input.source,
  });
  if (!confirmed.ok || !confirmed.visitId) {
    return { ok: false, error: confirmed.error ?? "Confirm failed", code: "conflict" };
  }

  await prisma.lecipmVisit.update({
    where: { id: confirmed.visitId },
    data: {
      rescheduleCount: prev.rescheduleCount + 1,
      workflowState: "RESCHEDULED",
    },
  });
  const { initializeLecipmVisitNoShow } = await import("./no-show-confirmation.service");
  void initializeLecipmVisitNoShow(confirmed.visitId);

  void recordLecipmNoShowEvent(prev.leadId, "RESCHEDULED", {
    previousVisitId: prev.id,
    newVisitId: confirmed.visitId,
  });
  return { ok: true, visitId: confirmed.visitId, message: "Rescheduled." };
}
