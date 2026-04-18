import { summarizeMontrealLeadAttribution } from "./traffic-attribution.service";
import { prisma } from "@/lib/db";
import { prismaWhereMontrealShortTerm } from "@/modules/market-intelligence/neighborhood-clustering.service";
import { subDays } from "date-fns";
import { AnalyticsFunnelEventName } from "@prisma/client";

export type DemandAcquisitionSnapshot = {
  generatedAt: string;
  attribution: Awaited<ReturnType<typeof summarizeMontrealLeadAttribution>>;
  analyticsFunnelSample: {
    landing_visit: number;
    search_used: number;
    listing_click: number;
    booking_started: number;
  };
  disclaimers: string[];
};

export async function buildDemandAcquisitionSnapshot(): Promise<DemandAcquisitionSnapshot> {
  const since = subDays(new Date(), 90);
  const attribution = await summarizeMontrealLeadAttribution(90);

  const mtlListingIds = (
    await prisma.shortTermListing.findMany({
      where: prismaWhereMontrealShortTerm(),
      select: { id: true },
    })
  ).map((r) => r.id);

  const [landing_visit, search_used, listing_click, booking_started, montrealListingClicks] = await Promise.all([
    prisma.analyticsFunnelEvent.count({
      where: { name: AnalyticsFunnelEventName.landing_visit, createdAt: { gte: since } },
    }),
    prisma.analyticsFunnelEvent.count({
      where: { name: AnalyticsFunnelEventName.search_used, createdAt: { gte: since } },
    }),
    prisma.analyticsFunnelEvent.count({
      where: { name: AnalyticsFunnelEventName.listing_click, createdAt: { gte: since } },
    }),
    prisma.analyticsFunnelEvent.count({
      where: { name: AnalyticsFunnelEventName.booking_started, createdAt: { gte: since } },
    }),
    mtlListingIds.length === 0
      ? Promise.resolve(0)
      : prisma.analyticsFunnelEvent.count({
          where: {
            name: AnalyticsFunnelEventName.listing_click,
            createdAt: { gte: since },
            listingId: { in: mtlListingIds },
          },
        }),
  ]);

  const disclaimers = [
    "Funnel counts are platform-internal `analytics_events` rows only.",
    `listing_click (all) vs Montréal BNHub listing join: ${listing_click} total, ${montrealListingClicks} Montréal stays.`,
  ];

  return {
    generatedAt: new Date().toISOString(),
    attribution,
    analyticsFunnelSample: { landing_visit, search_used, listing_click, booking_started },
    disclaimers,
  };
}
