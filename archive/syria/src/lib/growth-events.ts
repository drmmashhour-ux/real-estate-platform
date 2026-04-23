import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { syriaPlatformConfig } from "@/config/syria-platform.config";

export type GrowthEventInput = {
  eventType: string;
  payload?: Record<string, unknown>;
  userId?: string | null;
  propertyId?: string | null;
  bookingId?: string | null;
  inquiryId?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
};

function payloadWithinLimit(payload: Record<string, unknown>): boolean {
  const enc = new TextEncoder();
  return enc.encode(JSON.stringify(payload)).length <= syriaPlatformConfig.analytics.maxEventPayloadBytes;
}

/** Server-safe fire-and-forget analytics — never throws to callers. */
export async function trackSyriaGrowthEvent(input: GrowthEventInput): Promise<void> {
  try {
    const payload = input.payload ?? {};
    if (!payloadWithinLimit(payload)) return;
    await prisma.syriaGrowthEvent.create({
      data: {
        eventType: input.eventType,
        payload: payload as Prisma.InputJsonValue,
        userId: input.userId ?? undefined,
        propertyId: input.propertyId ?? undefined,
        bookingId: input.bookingId ?? undefined,
        inquiryId: input.inquiryId ?? undefined,
        utmSource: input.utm?.source ?? undefined,
        utmMedium: input.utm?.medium ?? undefined,
        utmCampaign: input.utm?.campaign ?? undefined,
      },
    });
  } catch {
    /* ignore — growth must not break primary flows */
  }
}

export async function countGrowthEventsByTypeSince(since: Date): Promise<Record<string, number>> {
  const rows = await prisma.syriaGrowthEvent.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });
  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.eventType] = r._count.id;
  }
  return out;
}

export async function getSyriaRevenueRollup(since: Date) {
  const verifiedByCurrency = await prisma.syriaListingPayment.groupBy({
    by: ["currency"],
    where: { status: "VERIFIED", createdAt: { gte: since } },
    _sum: { amount: true },
  });
  const featuredRows = await prisma.syriaListingPayment.aggregate({
    where: {
      status: "VERIFIED",
      purpose: "FEATURED",
      createdAt: { gte: since },
    },
    _sum: { amount: true },
  });
  const bookingTotals = await prisma.syriaBooking.aggregate({
    where: { createdAt: { gte: since } },
    _sum: { totalPrice: true, platformFeeAmount: true },
  });
  return {
    verifiedByCurrency,
    featuredListingRevenue: featuredRows._sum.amount ?? new Prisma.Decimal(0),
    bnhubBookingGross: bookingTotals._sum.totalPrice ?? new Prisma.Decimal(0),
    bnhubPlatformFees: bookingTotals._sum.platformFeeAmount ?? new Prisma.Decimal(0),
  };
}

export async function topUtmCampaignsSince(
  since: Date,
  take = 12,
): Promise<{ campaign: string | null; count: number }[]> {
  const rows = await prisma.syriaGrowthEvent.groupBy({
    by: ["utmCampaign"],
    where: { createdAt: { gte: since }, utmCampaign: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take,
  });
  return rows.map((r) => ({ campaign: r.utmCampaign, count: r._count.id }));
}

export async function leadsBySourceSince(since: Date): Promise<{ source: string | null; count: number }[]> {
  const rows = await prisma.syriaInquiry.groupBy({
    by: ["utmSource"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });
  return rows.map((r) => ({ source: r.utmSource, count: r._count.id }));
}

export async function bookingsBySourceSince(since: Date): Promise<{ source: string | null; count: number }[]> {
  const rows = await prisma.syriaBooking.groupBy({
    by: ["utmSource"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });
  return rows.map((r) => ({ source: r.utmSource, count: r._count.id }));
}

export async function topListingsByViewsSince(since: Date, take = 10) {
  const rows = await prisma.syriaGrowthEvent.groupBy({
    by: ["propertyId"],
    where: {
      eventType: "listing_view",
      createdAt: { gte: since },
      propertyId: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take,
  });
  return rows.map((r) => ({ propertyId: r.propertyId!, views: r._count.id }));
}
