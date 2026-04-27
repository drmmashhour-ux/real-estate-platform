import { prisma } from "@/lib/db";

function utcDayStart(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function utcDayEndExclusive(d: Date): Date {
  const x = utcDayStart(d);
  x.setUTCDate(x.getUTCDate() + 1);
  return x;
}

/** UTC “today” snapshot for the 5‑minute daily check (G4). */
export async function getG4DailySnapshotUTC() {
  const now = new Date();
  const start = utcDayStart(now);
  const end = utcDayEndExclusive(start);
  const [newListings, wa, calls, f1Requests, f1Confirmed] = await Promise.all([
    prisma.syriaProperty.count({
      where: { status: "PUBLISHED", fraudFlag: false, createdAt: { gte: start, lt: end } },
    }),
    prisma.syriaGrowthEvent.count({
      where: { eventType: "lead_whatsapp", createdAt: { gte: start, lt: end } },
    }),
    prisma.syriaGrowthEvent.count({
      where: { eventType: "lead_phone", createdAt: { gte: start, lt: end } },
    }),
    prisma.syriaPaymentRequest.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.syriaPaymentRequest.count({
      where: { status: "confirmed", confirmedAt: { gte: start, lt: end } },
    }),
  ]);
  return { dayKey: start.toISOString().slice(0, 10), newListings, wa, calls, f1Requests, f1Confirmed };
}

export function formatG4DailyLogLine(s: Awaited<ReturnType<typeof getG4DailySnapshotUTC>>): string {
  return `${s.dayKey} | new_listings=${s.newListings} | wa=${s.wa} | calls=${s.calls} | f1_req=${s.f1Requests} | f1_confirmed=${s.f1Confirmed}`;
}

export async function getG4TopCategoryByWhatsappClicks() {
  const rows = await prisma.syriaProperty.groupBy({
    by: ["category"],
    where: { status: "PUBLISHED", fraudFlag: false },
    _sum: { whatsappClicks: true },
    orderBy: { _sum: { whatsappClicks: "desc" } },
    take: 1,
  });
  const r = rows[0];
  if (!r) return { category: null as string | null, whatsappClicks: 0 };
  return { category: r.category, whatsappClicks: r._sum.whatsappClicks ?? 0 };
}

export async function getG4TopCityByEngagement() {
  const rows = await prisma.syriaProperty.groupBy({
    by: ["city"],
    where: { status: "PUBLISHED", fraudFlag: false },
    _sum: { views: true, whatsappClicks: true, phoneClicks: true },
  });
  if (rows.length === 0) {
    return { city: null as string | null, cityAr: null as string | null, score: 0 };
  }
  const scored = rows
    .map((r) => ({
      city: r.city,
      score: (r._sum.views ?? 0) + (r._sum.whatsappClicks ?? 0) + (r._sum.phoneClicks ?? 0),
    }))
    .sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top || top.score === 0) {
    return { city: null, cityAr: null, score: 0 };
  }
  const sample = await prisma.syriaProperty.findFirst({
    where: { status: "PUBLISHED", city: top.city },
    select: { cityAr: true },
  });
  return { city: top.city, cityAr: sample?.cityAr ?? null, score: top.score };
}

export type G4WeakListing = {
  id: string;
  titleAr: string;
  city: string;
  views: number;
  wa: number;
  phone: number;
  isDirect: boolean;
  images: string[];
  price: unknown;
};

/** views > 10 and combined lead taps < 2 — ops should improve copy / price / photos / direct. */
export async function getG4WeakListings(take = 30): Promise<G4WeakListing[]> {
  const rows = await prisma.syriaProperty.findMany({
    where: {
      status: "PUBLISHED",
      fraudFlag: false,
      views: { gt: 10 },
    },
    select: {
      id: true,
      titleAr: true,
      city: true,
      views: true,
      whatsappClicks: true,
      phoneClicks: true,
      isDirect: true,
      images: true,
      price: true,
    },
    take: 200,
  });
  return rows
    .filter((r) => (r.whatsappClicks ?? 0) + (r.phoneClicks ?? 0) < 2)
    .slice(0, take)
    .map((r) => ({
      id: r.id,
      titleAr: r.titleAr,
      city: r.city,
      views: r.views,
      wa: r.whatsappClicks ?? 0,
      phone: r.phoneClicks ?? 0,
      isDirect: r.isDirect,
      images: r.images,
      price: r.price,
    }));
}

const WEEK_MS = 7 * 86400000;

export async function getG4NewPublishedListingsLast7Days() {
  const since = new Date(Date.now() - WEEK_MS);
  return prisma.syriaProperty.count({
    where: { status: "PUBLISHED", fraudFlag: false, createdAt: { gte: since } },
  });
}

export const G4_WEEKLY_TARGETS = [50, 100, 200] as const;

/** G5: same as `getG4TopCategoryByWhatsappClicks` — highest total WhatsApp taps by marketplace `category`. */
export const getG5TopCategoryByWhatsappClicks = getG4TopCategoryByWhatsappClicks;

/**
 * G5 domination: city with the **highest sum of WhatsApp taps** on published listings.
 * Returns null when there are no taps yet (avoid a meaningless “top” city).
 */
export async function getG5TopCityByWhatsappClicks() {
  const rows = await prisma.syriaProperty.groupBy({
    by: ["city"],
    where: { status: "PUBLISHED", fraudFlag: false },
    _sum: { whatsappClicks: true },
    orderBy: { _sum: { whatsappClicks: "desc" } },
    take: 1,
  });
  const r = rows[0];
  const wa = r?._sum.whatsappClicks ?? 0;
  if (!r?.city || wa < 1) {
    return { city: null as string | null, cityAr: null as string | null, whatsappClicks: 0 };
  }
  const sample = await prisma.syriaProperty.findFirst({
    where: { status: "PUBLISHED", city: r.city },
    select: { cityAr: true },
  });
  return { city: r.city, cityAr: sample?.cityAr ?? null, whatsappClicks: wa };
}

export async function getG5PublishedCountInCity(city: string) {
  return prisma.syriaProperty.count({
    where: { status: "PUBLISHED", fraudFlag: false, city },
  });
}

/** Share of listings with `isDirect` in a city (local conversion nudge). */
export async function getG5DirectShareInCity(city: string): Promise<{ direct: number; total: number }> {
  const [direct, total] = await Promise.all([
    prisma.syriaProperty.count({
      where: { status: "PUBLISHED", fraudFlag: false, city, isDirect: true },
    }),
    prisma.syriaProperty.count({ where: { status: "PUBLISHED", fraudFlag: false, city } }),
  ]);
  return { direct, total };
}

export const G5_EXPAND_MIN_LISTINGS = 50;
