import { prisma } from "@/lib/db";

export type HubKey = "buy_hub" | "seller_hub" | "nbhub" | "mortgage_hub";

export type HubAnalyticsSlice = {
  hub: HubKey;
  label: string;
  listingsCreated: number;
  dealsOrLeads: number;
  rentalsOrBookings: number;
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function getInvestorHubAnalytics(days: 7 | 30 = 7): Promise<{
  days: number;
  hubs: HubAnalyticsSlice[];
  series: { date: string; buy_hub: number; seller_hub: number; nbhub: number; mortgage_hub: number }[];
}> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const rangeStart = addUtcDays(todayStart, -(days - 1));

  const [
    fsboCreated,
    stCreated,
    buyerViews,
    buyerReqs,
    mortgageLeads,
    bookings,
    offers,
  ] = await Promise.all([
    prisma.fsboListing.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.shortTermListing.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.buyerListingView.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.buyerRequest.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.mortgageRequest.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.booking.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.offer.count({ where: { createdAt: { gte: rangeStart } } }),
  ]);

  const hubs: HubAnalyticsSlice[] = [
    {
      hub: "buy_hub",
      label: "BuyHub",
      listingsCreated: buyerViews,
      dealsOrLeads: buyerReqs + offers,
      rentalsOrBookings: 0,
    },
    {
      hub: "seller_hub",
      label: "SellerHub (FSBO)",
      listingsCreated: fsboCreated,
      dealsOrLeads: offers,
      rentalsOrBookings: 0,
    },
    {
      hub: "nbhub",
      label: "NBHub",
      /** Short-term stays only — CRM `listing` rows belong to broker inventory, not BNHub. */
      listingsCreated: stCreated,
      dealsOrLeads: offers,
      rentalsOrBookings: bookings,
    },
    {
      hub: "mortgage_hub",
      label: "MortgageHub",
      listingsCreated: mortgageLeads,
      dealsOrLeads: mortgageLeads,
      rentalsOrBookings: 0,
    },
  ];

  const series: { date: string; buy_hub: number; seller_hub: number; nbhub: number; mortgage_hub: number }[] = [];
  for (let i = 0; i < days; i++) {
    const dayStart = addUtcDays(rangeStart, i);
    const dayEnd = addUtcDays(dayStart, 1);
    const key = dayStart.toISOString().slice(0, 10);
    const [bv, fs, st, mg] = await Promise.all([
      prisma.buyerListingView.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.fsboListing.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.shortTermListing.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.mortgageRequest.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    ]);
    series.push({
      date: key,
      buy_hub: bv,
      seller_hub: fs,
      nbhub: st,
      mortgage_hub: mg,
    });
  }

  return { days, hubs, series };
}
