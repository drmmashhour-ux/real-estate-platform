/**
 * LECIPM Marketing Intelligence Activation — emits real MarketingSystemEvent rows (no fabrication).
 * Idempotent via meta.idempotencyKey or subject (booking) keys.
 */
import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { hasPerformanceIdempotencyKey, recordPerformanceEvent } from "@/modules/marketing-performance";
import { recordFunnelStep } from "@/modules/funnel/funnel.service";

function enabled() {
  return engineFlags.marketingIntelligenceV1;
}

async function hasFunnelBookingCompleted(bookingId: string): Promise<boolean> {
  const row = await prisma.marketingSystemEvent.findFirst({
    where: {
      category: MarketingSystemEventCategory.FUNNEL,
      eventKey: "booking_completed",
      subjectType: "booking",
      subjectId: bookingId,
    },
    select: { id: true },
  });
  return Boolean(row);
}

/** BNHub paid booking — revenue attributed to listing owner (host) for ROI dashboards. */
export async function emitBnhubBookingCompletedMarketing(opts: {
  bookingId: string;
  listingId: string;
  guestUserId: string;
  hostUserId: string;
  amountCents: number | null;
}): Promise<void> {
  if (!enabled()) return;

  const idem = `mi:bnhub_booking_revenue:${opts.bookingId}`;
  if (await hasPerformanceIdempotencyKey(idem)) return;

  await recordPerformanceEvent({
    userId: opts.hostUserId,
    eventKey: "revenue",
    subjectType: "listing",
    subjectId: opts.listingId,
    amountCents: opts.amountCents ?? undefined,
    meta: {
      idempotencyKey: idem,
      source: "bnhub",
      bookingId: opts.bookingId,
      guestUserId: opts.guestUserId,
      type: "booking_completed",
    },
  });

  await recordPerformanceEvent({
    userId: opts.hostUserId,
    eventKey: "booking",
    subjectType: "listing",
    subjectId: opts.listingId,
    meta: {
      idempotencyKey: `mi:bnhub_booking_count:${opts.bookingId}`,
      source: "bnhub",
      bookingId: opts.bookingId,
      type: "booking_completed",
    },
  });

  if (await hasFunnelBookingCompleted(opts.bookingId)) return;

  await recordFunnelStep({
    step: "booking_completed",
    userId: opts.guestUserId,
    bookingId: opts.bookingId,
    meta: {
      idempotencyKey: `mi:funnel_booking:${opts.bookingId}`,
      listingId: opts.listingId,
      source: "bnhub",
    },
  });
}

/** Generic Stripe checkout success — revenue to payer; idempotent per session. */
export async function emitStripeCheckoutCompletedMarketing(opts: {
  userId: string;
  amountCents: number | null;
  stripeSessionId: string;
  feature?: string | null;
}): Promise<void> {
  if (!enabled()) return;
  const idem = `mi:stripe_checkout:${opts.stripeSessionId}`;
  if (await hasPerformanceIdempotencyKey(idem)) return;

  await recordPerformanceEvent({
    userId: opts.userId,
    eventKey: "revenue",
    amountCents: opts.amountCents ?? undefined,
    meta: {
      idempotencyKey: idem,
      source: "stripe",
      type: "checkout_completed",
      stripeSessionId: opts.stripeSessionId,
      feature: opts.feature ?? null,
    },
  });
}

export async function emitLeadCaptureMarketing(opts: {
  userId: string;
  source?: string | null;
  campaignId?: string | null;
  leadId: string;
}): Promise<void> {
  if (!enabled()) return;
  const idem = `mi:lead_capture:${opts.leadId}`;
  if (await hasPerformanceIdempotencyKey(idem)) return;

  await recordPerformanceEvent({
    userId: opts.userId,
    eventKey: "lead",
    subjectType: opts.campaignId ? "campaign" : null,
    subjectId: opts.campaignId ?? null,
    meta: {
      idempotencyKey: idem,
      source: opts.source ?? "unknown",
      leadId: opts.leadId,
      type: "lead_capture",
    },
  });

  await recordFunnelStep({
    step: "lead_capture",
    userId: opts.userId,
    campaignId: opts.campaignId ?? undefined,
    meta: {
      leadId: opts.leadId,
      source: opts.source,
      idempotencyKey: `mi:funnel_lead_capture:${opts.leadId}`,
    },
  });
}

/** Anonymous / session-based lead from public landing — funnel only (no performance revenue attribution). */
export async function emitPublicLandingLeadFunnel(opts: {
  leadId: string;
  sessionId?: string | null;
  campaign?: string | null;
  source?: string | null;
}): Promise<void> {
  if (!enabled()) return;
  await recordFunnelStep({
    step: "lead_capture",
    userId: null,
    sessionId: opts.sessionId ?? null,
    campaignId: opts.campaign ?? undefined,
    meta: {
      leadId: opts.leadId,
      /** Aligns with landing beacon rows for `/dashboard/growth` aggregates. */
      source: "ads_landing_beacon",
      adPlatform: opts.source ?? "unknown",
      idempotencyKey: `mi:funnel_lead_public:${opts.leadId}`,
    },
  });
}
