import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";
import { assertBrokerSlotFree } from "@/lib/visits/broker-schedule";
import { formatVisitSummaryLine } from "@/lib/visits/format-lines";
import { notifyCustomerOnVisitUpdate } from "@/lib/visits/notify";
import { appendLecipmVisitThreadMessage } from "@/lib/visits/thread-message";

export async function acceptVisitRequest(
  requestId: string,
  brokerUserId: string,
  brokerNote?: string | null
): Promise<void> {
  const req = await prisma.lecipmVisitRequest.findFirst({
    where: { id: requestId, brokerUserId, status: "pending" },
    include: { listing: { select: { title: true } } },
  });
  if (!req) throw new Error("Request not found or already handled");

  await assertBrokerSlotFree(req.brokerUserId, req.requestedStart, req.requestedEnd, {
    excludeVisitRequestId: req.id,
  });

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.lecipmVisit.create({
      data: {
        visitRequestId: req.id,
        leadId: req.leadId,
        listingId: req.listingId,
        brokerUserId: req.brokerUserId,
        customerUserId: req.customerUserId,
        startDateTime: req.requestedStart,
        endDateTime: req.requestedEnd,
        status: "scheduled",
      },
    });
    await tx.lecipmVisitRequest.update({
      where: { id: req.id },
      data: { status: "accepted", brokerNote: brokerNote?.trim() || null },
    });
    await tx.$executeRaw(
      Prisma.sql`UPDATE lecipm_broker_crm_leads SET status = 'visit_scheduled', updated_at = ${now} WHERE id = ${req.leadId}`
    );
  });

  const title = req.listing?.title ?? "Listing";
  if (req.threadId) {
    await appendLecipmVisitThreadMessage(
      req.threadId,
      formatVisitSummaryLine({
        kind: "accepted",
        listingTitle: title,
        start: req.requestedStart,
        end: req.requestedEnd,
      })
    );
    await appendLecipmVisitThreadMessage(
      req.threadId,
      `💡 After your visit: reply here to **ask a question**, or open **Make an offer** from the listing when you’re ready. (LECIPM autopilot)`
    );
  }

  void recordAnalyticsFunnelEvent({
    name: "visit_confirmed",
    listingId: req.listingId,
    userId: req.customerUserId,
    source: "broker_accept",
    metadata: { visitRequestId: req.id },
  });

  notifyCustomerOnVisitUpdate({
    customerUserId: req.customerUserId,
    guestEmail: req.guestEmail,
    message: "Your property visit was confirmed.",
  });
}
