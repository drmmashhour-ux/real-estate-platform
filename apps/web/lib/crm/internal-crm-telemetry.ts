import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { refreshLeadAutomationScoring } from "@/lib/automation/engine";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { refreshLeadExecutionLayer } from "@/src/modules/crm/leadExecutionRefresh";
import { CRM_JOB_BNHUB_BOOKING_THANKS_EMAIL } from "./internal-crm-constants";

export type InternalCrmChannel = "bnhub" | "fsbo" | "marketplace" | "mortgage" | "platform";

export type RecordInternalCrmEventInput = {
  eventType: string;
  channel?: InternalCrmChannel;
  userId?: string | null;
  sessionId?: string | null;
  leadId?: string | null;
  shortTermListingId?: string | null;
  fsboListingId?: string | null;
  bookingId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function resolveBnhubLeadForStay(
  userId: string | undefined,
  shortTermListingId: string | undefined,
): Promise<string | null> {
  if (!userId || !shortTermListingId) return null;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: shortTermListingId },
    select: { listingCode: true },
  });
  const code = listing?.listingCode?.trim();
  const lead = await prisma.lead.findFirst({
    where: {
      userId,
      OR: [{ shortTermListingId }, ...(code ? [{ listingCode: code }] : [])],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return lead?.id ?? null;
}

/**
 * Persist a unified CRM telemetry row and optionally bump linked `Lead` scoring.
 * @returns resolved `leadId` when linked to a platform Lead row.
 */
export async function recordInternalCrmEvent(
  input: RecordInternalCrmEventInput,
): Promise<{ leadId: string | null }> {
  const channel = input.channel ?? "platform";
  let leadId = input.leadId?.trim() || null;
  if (!leadId && input.userId && input.shortTermListingId) {
    leadId = await resolveBnhubLeadForStay(input.userId, input.shortTermListingId);
  }

  await prisma.internalCrmEvent.create({
    data: {
      eventType: input.eventType,
      channel,
      userId: input.userId ?? undefined,
      sessionId: input.sessionId?.slice(0, 128) ?? undefined,
      leadId: leadId ?? undefined,
      shortTermListingId: input.shortTermListingId ?? undefined,
      fsboListingId: input.fsboListingId ?? undefined,
      bookingId: input.bookingId ?? undefined,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  if (leadId) {
    await applySingleCrmEventToLead(leadId, input.eventType).catch(() => {});
    await refreshLeadExecutionLayer(leadId).catch(() => {});
  }

  return { leadId };
}

const ENGAGEMENT_CAP = 40;

/** One row = one bump (avoids double-counting when recomputing). Uses same tier refresh as broker automation. */
async function applySingleCrmEventToLead(leadId: string, eventType: string): Promise<void> {
  let delta = 0;
  let setHighIntent = false;
  switch (eventType) {
    case "listing_view":
      delta = 1;
      break;
    case "cta_click":
    case "listing_contact_click":
      delta = 3;
      break;
    case "session_heartbeat":
      delta = 1;
      break;
    case "booking_confirmed":
      delta = 12;
      setHighIntent = true;
      break;
    case "booking_started":
      delta = 8;
      break;
    default:
      break;
  }

  if (!delta && !setHighIntent) return;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(setHighIntent ? { highIntent: true } : {}),
      ...(delta ? { engagementScore: { increment: delta } } : {}),
    },
  });

  const row = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { engagementScore: true },
  });
  if (row && row.engagementScore > ENGAGEMENT_CAP) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { engagementScore: ENGAGEMENT_CAP },
    });
  }

  await refreshLeadAutomationScoring(leadId).catch(() => {});
}

/**
 * Admin / maintenance: re-derive tier from last 14d of telemetry (idempotent-ish: re-applies scoring only).
 */
export async function refreshLeadSignalsFromTelemetry(leadId: string): Promise<void> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);
  const hasBooking = await prisma.internalCrmEvent.findFirst({
    where: { leadId, eventType: "booking_confirmed", createdAt: { gte: since } },
    select: { id: true },
  });
  if (hasBooking) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { highIntent: true },
    });
  }
  await refreshLeadAutomationScoring(leadId).catch(() => {});
}

export async function recordBnhubActivityToInternalCrm(params: {
  userId: string;
  eventType: string;
  listingId?: string | null;
  durationSeconds?: number | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const listingId = params.listingId?.trim();
  if (!listingId) return;

  const st = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!st) return;

  if (
    params.eventType !== "listing_view" &&
    params.eventType !== "listing_contact_click" &&
    params.eventType !== "session_heartbeat"
  ) {
    return;
  }

  const normalizedType = params.eventType === "listing_contact_click" ? "cta_click" : params.eventType;

  await recordInternalCrmEvent({
    eventType: normalizedType,
    channel: "bnhub",
    userId: params.userId,
    shortTermListingId: listingId,
    metadata: {
      source: "ai_activity",
      durationSeconds: params.durationSeconds ?? undefined,
      ...params.metadata,
    },
  });
}

/**
 * Called after BNHub booking is paid — telemetry + optional delayed thank-you email job.
 */
export async function onBnhubBookingPaymentConfirmed(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, guestId: true, listingId: true, status: true },
  });
  if (!booking) return;

  const { leadId: resolvedLead } = await recordInternalCrmEvent({
    eventType: "booking_confirmed",
    channel: "bnhub",
    userId: booking.guestId,
    shortTermListingId: booking.listingId,
    bookingId: booking.id,
    metadata: { bookingStatus: booking.status },
  });

  const leadId = resolvedLead ?? (await resolveBnhubLeadForStay(booking.guestId, booking.listingId));
  if (leadId) {
    await appendLeadTimelineEvent(leadId, "bnhub_booking_confirmed", {
      bookingId: booking.id,
      listingId: booking.listingId,
    }).catch(() => {});

    const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
    const dup = await prisma.leadFollowUpJob.findFirst({
      where: {
        leadId,
        jobKey: CRM_JOB_BNHUB_BOOKING_THANKS_EMAIL,
        status: { in: ["pending", "processing"] },
      },
      select: { id: true },
    });
    if (!dup) {
      await prisma.leadFollowUpJob
        .create({
          data: {
            leadId,
            jobKey: CRM_JOB_BNHUB_BOOKING_THANKS_EMAIL,
            scheduledFor: inOneHour,
            status: "pending",
          },
        })
        .catch(() => {});
    }
  }
}
