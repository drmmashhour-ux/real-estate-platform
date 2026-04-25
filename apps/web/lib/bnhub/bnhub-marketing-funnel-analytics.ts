import { prisma } from "@/lib/db";
import { GrowthEventName } from "@/modules/growth/event-types";

export type BnhubMarketingFunnelTopListing = {
  listingKey: string;
  views: number;
  title: string | null;
  city: string | null;
};

function startEnd(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - Math.max(1, Math.min(180, days)) * 86_400_000);
  return { start, end };
}

/**
 * BNHub “first 100 users” funnel — reads `growth_events` written by `/api/analytics/track` + server lead/booking events.
 */
export async function loadBnhubMarketingFunnelDashboard(days = 30) {
  const { start, end } = startEnd(days);

  const [
    visitorsRows,
    emailCaptureRows,
    accountSignups,
    bookingStarted,
    bookingCompleted,
    topListingRows,
  ] = await Promise.all([
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c
      FROM growth_events
      WHERE created_at >= ${start}
        AND created_at < ${end}
        AND event_name = ${GrowthEventName.LANDING_VIEW}
        AND COALESCE(metadata->>'path', '') LIKE ${"%/bnhub/landing%"}
    `,
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c
      FROM growth_events
      WHERE created_at >= ${start}
        AND created_at < ${end}
        AND event_name = ${GrowthEventName.LEAD_CAPTURE}
        AND COALESCE(metadata->>'surface', '') = 'bnhub_marketing_landing'
    `,
    prisma.growthEvent.count({
      where: {
        createdAt: { gte: start, lt: end },
        eventName: GrowthEventName.SIGNUP_SUCCESS,
      },
    }),
    prisma.growthEvent.count({
      where: {
        createdAt: { gte: start, lt: end },
        eventName: GrowthEventName.BOOKING_STARTED,
      },
    }),
    prisma.growthEvent.count({
      where: {
        createdAt: { gte: start, lt: end },
        eventName: GrowthEventName.BOOKING_COMPLETED,
      },
    }),
    prisma.$queryRaw<{ listing_key: string | null; c: bigint }[]>`
      SELECT listing_key, COUNT(*)::bigint AS c
      FROM (
        SELECT NULLIF(
          TRIM(COALESCE(
            metadata->'clientMeta'->>'listingId',
            metadata->'clientMeta'->>'listingCode',
            metadata->>'listingId',
            metadata->>'listingCode'
          )),
          ''
        ) AS listing_key
        FROM growth_events
        WHERE created_at >= ${start}
          AND created_at < ${end}
          AND event_name = ${GrowthEventName.LISTING_VIEW}
          AND COALESCE(metadata->>'path', '') LIKE ${"%bnhub%"}
      ) sub
      WHERE listing_key IS NOT NULL
      GROUP BY listing_key
      ORDER BY c DESC
      LIMIT 12
    `,
  ]);

  const visitors = Number(visitorsRows[0]?.c ?? 0);
  const emailCaptures = Number(emailCaptureRows[0]?.c ?? 0);

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 10_000) / 100 : 0);

  const listingKeys = topListingRows
    .map((r) => r.listing_key)
    .filter((k): k is string => Boolean(k));

  const listings =
    listingKeys.length > 0
      ? await prisma.shortTermListing.findMany({
          where: {
            OR: [{ id: { in: listingKeys } }, { listingCode: { in: listingKeys } }],
          },
          select: { id: true, listingCode: true, title: true, city: true },
        })
      : [];

  const metaByKey = new Map<string, { title: string | null; city: string | null }>();
  for (const l of listings) {
    metaByKey.set(l.id, { title: l.title, city: l.city });
    if (l.listingCode) metaByKey.set(l.listingCode, { title: l.title, city: l.city });
  }

  const topListings: BnhubMarketingFunnelTopListing[] = topListingRows
    .filter((r) => r.listing_key)
    .map((r) => {
      const key = r.listing_key as string;
      const m = metaByKey.get(key);
      return {
        listingKey: key,
        views: Number(r.c),
        title: m?.title ?? null,
        city: m?.city ?? null,
      };
    });

  return {
    range: { days, start: start.toISOString(), end: end.toISOString() },
    counts: {
      visitors,
      emailCaptures,
      accountSignups,
      bookingStarted,
      bookingCompleted,
    },
    rates: {
      emailCaptureRate: pct(emailCaptures, visitors),
      signupRate: pct(accountSignups, visitors),
      bookingRate: pct(bookingCompleted, visitors),
      bookingFromEmailRate: pct(bookingCompleted, emailCaptures),
    },
    topListings,
  };
}
