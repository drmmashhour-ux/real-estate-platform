/**
 * Builds and persists a deterministic BNHub host revenue narrative (rules-based; not LLM output).
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPricingImpactSummary } from "@/modules/bnhub-revenue/bnhub-pricing-impact.service";
import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { buildRevenueNarrative } from "./narrative-builder.service";
import {
  getLatestTwoPortfolioSnapshots,
  mapBnhubSnapshotToMetrics,
} from "./narrative-data.service";
import type { NarrativeMetricsSlice, NarrativeSummary } from "./narrative.types";

function livePortfolioToMetrics(summary: Awaited<ReturnType<typeof getRevenueDashboardSummary>>["portfolio"]): NarrativeMetricsSlice {
  return {
    grossRevenue: summary.grossRevenue,
    bookingCount: summary.bookingCount,
    occupancyRate: summary.occupancyRate,
    adr: summary.adr,
    revpar: summary.revpar,
    occupiedNights: summary.occupiedNights,
    availableNights: summary.availableNights,
  };
}

export async function generateHostRevenueNarrative(
  userId: string,
  opts?: { persist?: boolean }
): Promise<NarrativeSummary> {
  const [summary, pricingImpact, snapshots] = await Promise.all([
    getRevenueDashboardSummary(userId),
    getPricingImpactSummary(userId),
    getLatestTwoPortfolioSnapshots(userId),
  ]);

  const current = snapshots.current
    ? mapBnhubSnapshotToMetrics(snapshots.current)
    : livePortfolioToMetrics(summary.portfolio);

  const previous = snapshots.previous ? mapBnhubSnapshotToMetrics(snapshots.previous) : null;

  const cc = summary.portfolio.displayCurrency ?? "USD";

  const narrative = buildRevenueNarrative({
    current,
    previous,
    listingCount: summary.portfolio.listingCount,
    pricingAppliedCount: pricingImpact.appliedCount,
    currencyCode: cc,
  });

  const persist = opts?.persist !== false;
  if (persist) {
    await prisma.bnhubDashboardNarrativeSnapshot.create({
      data: {
        scopeType: "host",
        scopeId: userId,
        periodLabel: "last_30_days",
        summaryText: `${narrative.headline}\n\n${narrative.overview}\n\n${narrative.closing}`,
        factsJson: narrative.facts as unknown as Prisma.InputJsonValue,
        risksJson: narrative.risks as unknown as Prisma.InputJsonValue,
        opportunitiesJson: narrative.opportunities as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return narrative;
}
