import { prisma } from "@/lib/db";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";
import { resolveBrokerForListing } from "@/lib/messages/resolve-broker-for-listing";
import { assertBrokerSlotFree } from "@/lib/visits/broker-schedule";
import { findLeadForVisitRequest } from "@/lib/visits/find-lead-for-visit";
import { clampDurationMinutes } from "@/lib/visits/validators";
import { appendLecipmVisitThreadMessage } from "@/lib/visits/thread-message";
import { notifyBrokerOnVisitRequest } from "@/lib/visits/notify";
import { formatVisitSummaryLine } from "@/lib/visits/format-lines";

export async function createVisitRequest(input: {
  listingId: string;
  leadId?: string | null;
  threadId?: string | null;
  requestedStart: Date;
  customerUserId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  durationMinutes?: number;
}): Promise<{ id: string }> {
  const duration = clampDurationMinutes(input.durationMinutes);
  const requestedEnd = new Date(input.requestedStart.getTime() + duration * 60 * 1000);

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: { id: true, title: true },
  });
  if (!listing) throw new Error("Listing not found");

  const brokerUserId = await resolveBrokerForListing(input.listingId, null);
  if (!brokerUserId) throw new Error("Could not resolve broker for this listing");

  const lead = await findLeadForVisitRequest({
    listingId: input.listingId,
    leadId: input.leadId,
    threadId: input.threadId,
  });

  if (!lead) throw new Error("Lead not found for this listing — contact the broker from the listing first.");

  if (lead.broker_user_id !== brokerUserId) throw new Error("Broker mismatch");

  await assertBrokerSlotFree(brokerUserId, input.requestedStart, requestedEnd);

  const customerUserId = input.customerUserId?.trim() || lead.customer_user_id;
  const guestName = input.guestName?.trim() || lead.guest_name;
  const guestEmail = input.guestEmail?.trim() || lead.guest_email;

  const row = await prisma.lecipmVisitRequest.create({
    data: {
      leadId: lead.id,
      threadId: lead.thread_id,
      listingId: input.listingId,
      brokerUserId,
      customerUserId,
      guestName,
      guestEmail,
      requestedStart: input.requestedStart,
      requestedEnd,
      durationMinutes: duration,
      status: "pending",
    },
  });

  notifyBrokerOnVisitRequest({
    brokerUserId,
    visitRequestId: row.id,
    listingTitle: listing.title,
  });

  if (lead.thread_id) {
    const line = formatVisitSummaryLine({
      kind: "requested",
      listingTitle: listing.title,
      start: input.requestedStart,
      end: requestedEnd,
    });
    await appendLecipmVisitThreadMessage(lead.thread_id, line);
  }

  void recordAnalyticsFunnelEvent({
    name: "visit_request",
    listingId: input.listingId,
    userId: customerUserId ?? undefined,
    source: "visit_request_api",
    metadata: { visitRequestId: row.id, leadId: lead.id },
  });

  return { id: row.id };
}
