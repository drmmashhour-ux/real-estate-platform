/**
 * Investor macro narrative — aggregated from all **published** BNHub listings (two fixed 30-day UTC windows).
 */

import { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildRevenueNarrative } from "./narrative-builder.service";
import { getInvestorPlatformMetricPair } from "./narrative-data.service";
import type { NarrativeSummary } from "./narrative.types";

export async function generateInvestorNarrative(): Promise<NarrativeSummary> {
  const listingCount = await prisma.shortTermListing.count({
    where: { listingStatus: ListingStatus.PUBLISHED },
  });

  const pricingAppliedCount = await prisma.bnhubPricingExecutionLog.count({
    where: { status: "success" },
  });

  const { current, previous } = await getInvestorPlatformMetricPair();

  const empty =
    listingCount === 0 &&
    current.bookingCount === 0 &&
    current.grossRevenue === 0 &&
    previous.bookingCount === 0 &&
    previous.grossRevenue === 0;

  if (empty) {
    const emptySummary: NarrativeSummary = {
      headline: "No investor narrative inputs available yet.",
      overview:
        "Published BNHub listings and booking totals are required before this macro narrative can summarize platform-wide signals.",
      facts: [],
      risks: [],
      opportunities: [],
      closing:
        "Once published listings exist and bookings fall into the metric windows, rerun this deterministic narrative.",
    };

    await prisma.bnhubDashboardNarrativeSnapshot.create({
      data: {
        scopeType: "investor",
        scopeId: "platform",
        periodLabel: "last_30_days",
        summaryText: `${emptySummary.headline}\n\n${emptySummary.overview}\n\n${emptySummary.closing}`,
        factsJson: [],
        risksJson: [],
        opportunitiesJson: [],
      },
    });

    return emptySummary;
  }

  const narrative = buildRevenueNarrative({
    current,
    previous,
    listingCount,
    pricingAppliedCount,
    currencyCode: "USD",
  });

  await prisma.bnhubDashboardNarrativeSnapshot.create({
    data: {
      scopeType: "investor",
      scopeId: "platform",
      periodLabel: "last_30_days",
      summaryText: `${narrative.headline}\n\n${narrative.overview}\n\n${narrative.closing}`,
      factsJson: narrative.facts as unknown as Prisma.InputJsonValue,
      risksJson: narrative.risks as unknown as Prisma.InputJsonValue,
      opportunitiesJson: narrative.opportunities as unknown as Prisma.InputJsonValue,
    },
  });

  return narrative;
}
