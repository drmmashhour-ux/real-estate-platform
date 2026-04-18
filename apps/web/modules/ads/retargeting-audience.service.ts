import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RetargetingAudienceSlice = {
  /** Distinct signed-in users where applicable; anonymous sessions counted separately for visitors only. */
  count: number;
  anonymousSessions?: number;
  lastActivity: string | null;
  conversionGap: string;
};

export type RetargetingAudiences = {
  visitors: RetargetingAudienceSlice;
  engaged: RetargetingAudienceSlice;
  highIntent: RetargetingAudienceSlice;
  hotLeads: RetargetingAudienceSlice;
  abandonedBookings: RetargetingAudienceSlice;
};

async function distinctUsers(eventNames: string[], since: Date): Promise<number> {
  const rows = await prisma.growthEvent.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: since },
      eventName: { in: eventNames },
      userId: { not: null },
    },
    _count: { _all: true },
  });
  return rows.filter((r) => r.userId).length;
}

async function lastEventAt(eventNames: string[], since: Date): Promise<Date | null> {
  const row = await prisma.growthEvent.aggregate({
    where: { createdAt: { gte: since }, eventName: { in: eventNames } },
    _max: { createdAt: true },
  });
  return row._max.createdAt;
}

async function anonymousSessionsForEvents(eventNames: string[], since: Date): Promise<number> {
  const rows = await prisma.growthEvent.groupBy({
    by: ["sessionId"],
    where: {
      createdAt: { gte: since },
      eventName: { in: eventNames },
      userId: null,
      sessionId: { not: null },
    },
    _count: { _all: true },
  });
  return rows.length;
}

/**
 * Build retargeting-oriented audience counts from `growth_events`, `Lead`, and `Booking`.
 * No Meta/Google export — planning + CRM use only.
 */
export async function buildRetargetingAudiences(rangeDays: number): Promise<RetargetingAudiences> {
  const since = new Date(Date.now() - rangeDays * 864e5);

  const [visitorUsers, visitorAnon, engagedUsers, highUsers, lastVisit, lastEng, lastLi] = await Promise.all([
    distinctUsers(["landing_view", "page_view"], since),
    anonymousSessionsForEvents(["landing_view", "page_view"], since),
    distinctUsers(["cta_click"], since),
    distinctUsers(["listing_view"], since),
    lastEventAt(["landing_view", "page_view"], since),
    lastEventAt(["cta_click"], since),
    lastEventAt(["listing_view"], since),
  ]);

  const leadsWithUsers = await prisma.lead.findMany({
    where: {
      createdAt: { gte: since },
      userId: { not: null },
    },
    select: { userId: true, id: true, createdAt: true },
  });
  const leadUserIds = [...new Set(leadsWithUsers.map((l) => l.userId!))];
  let hotLeadCount = 0;
  if (leadUserIds.length > 0) {
    const booked = await prisma.growthEvent.findMany({
      where: {
        userId: { in: leadUserIds },
        createdAt: { gte: since },
        eventName: "booking_completed",
      },
      distinct: ["userId"],
      select: { userId: true },
    });
    const bookedSet = new Set(booked.map((b) => b.userId!));
    hotLeadCount = leadUserIds.filter((id) => !bookedSet.has(id)).length;
  }

  const abandoned = await prisma.booking.count({
    where: {
      createdAt: { gte: since },
      status: { in: [BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL] },
    },
  });

  const lastLead = await prisma.lead.aggregate({
    where: { createdAt: { gte: since } },
    _max: { createdAt: true },
  });

  const lastBooking = await prisma.booking.aggregate({
    where: {
      createdAt: { gte: since },
      status: { in: [BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL] },
    },
    _max: { createdAt: true },
  });

  return {
    visitors: {
      count: visitorUsers,
      anonymousSessions: visitorAnon,
      lastActivity: lastVisit?.toISOString() ?? null,
      conversionGap:
        engagedUsers < visitorUsers
          ? "Many visitors never clicked a tracked CTA — add clearer above-the-fold actions."
          : "Visitor → engagement ratio is healthy — scale traffic.",
    },
    engaged: {
      count: engagedUsers,
      lastActivity: lastEng?.toISOString() ?? null,
      conversionGap:
        highUsers < engagedUsers
          ? "CTA clicks are not always reaching listing views — fix destination URLs and listing quality."
          : "Engagement is flowing to listings.",
    },
    highIntent: {
      count: highUsers,
      lastActivity: lastLi?.toISOString() ?? null,
      conversionGap:
        hotLeadCount > 0
          ? `${hotLeadCount} logged-in leads have not completed a booking signal yet — retarget with urgency.`
          : "Listing viewers may be anonymous — capture email/SMS where compliant.",
    },
    hotLeads: {
      count: hotLeadCount,
      lastActivity: lastLead._max.createdAt?.toISOString() ?? null,
      conversionGap: "Lead submitted but no `booking_completed` growth signal for that user in-window.",
    },
    abandonedBookings: {
      count: abandoned,
      lastActivity: lastBooking._max.createdAt?.toISOString() ?? null,
      conversionGap:
        abandoned > 0
          ? "Outstanding unpaid / unconfirmed bookings — send recovery + Stripe checkout reminders."
          : "No stalled bookings in this window.",
    },
  };
}
