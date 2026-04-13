import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { assertBrokerSlotFree } from "@/lib/visits/broker-schedule";
import { formatVisitSummaryLine } from "@/lib/visits/format-lines";
import { notifyCustomerOnVisitUpdate } from "@/lib/visits/notify";
import { appendLecipmVisitThreadMessage } from "@/lib/visits/thread-message";
import { clampDurationMinutes } from "@/lib/visits/validators";

export async function rescheduleVisitRequest(opts: {
  requestId: string;
  brokerUserId: string;
  newStart: Date;
  durationMinutes?: number;
  brokerNote?: string | null;
}): Promise<void> {
  const req = await prisma.lecipmVisitRequest.findFirst({
    where: { id: opts.requestId, brokerUserId: opts.brokerUserId },
    include: { visit: true, listing: { select: { title: true } } },
  });
  if (!req) throw new Error("Not found");

  if (req.status === "rejected" || req.status === "cancelled") {
    throw new Error("Cannot reschedule this request");
  }

  const duration = clampDurationMinutes(opts.durationMinutes ?? req.durationMinutes);
  const newEnd = addMinutes(opts.newStart, duration);

  await assertBrokerSlotFree(req.brokerUserId, opts.newStart, newEnd, { excludeVisitRequestId: req.id });

  await prisma.$transaction(async (tx) => {
    await tx.lecipmVisitRequest.update({
      where: { id: req.id },
      data: {
        requestedStart: opts.newStart,
        requestedEnd: newEnd,
        durationMinutes: duration,
        brokerNote: opts.brokerNote?.trim() ?? req.brokerNote,
      },
    });
    if (req.visit) {
      await tx.lecipmVisit.update({
        where: { id: req.visit.id },
        data: { startDateTime: opts.newStart, endDateTime: newEnd },
      });
    }
  });

  const title = req.listing?.title ?? "Listing";
  if (req.threadId) {
    await appendLecipmVisitThreadMessage(
      req.threadId,
      formatVisitSummaryLine({
        kind: "rescheduled",
        listingTitle: title,
        start: opts.newStart,
        end: newEnd,
      })
    );
  }

  notifyCustomerOnVisitUpdate({
    customerUserId: req.customerUserId,
    guestEmail: req.guestEmail,
    message: "Your visit was rescheduled.",
  });
}
