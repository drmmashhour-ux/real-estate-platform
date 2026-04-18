import { revenueV4Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { STALE_LISTING_DAYS } from "@/src/modules/revenue/revenue.constants";
import { logRevenueEngineV4Event } from "@/src/modules/revenue/revenue.logger";

export type RevenueOpportunityV4 = {
  type: string;
  score: number;
  expectedRevenueLift: number | null;
  liftConfidence: "high" | "medium" | "low";
  riskLevel: "low" | "medium" | "high";
  action: string;
  entityType: string;
  entityId: string;
  explanation: string[];
};

function daysSince(d: Date): number {
  return (Date.now() - d.getTime()) / 86400000;
}

/**
 * Detects monetization / pricing opportunities for a single FSBO listing — suggestions only.
 */
export async function detectFsboRevenueOpportunities(listingId: string): Promise<RevenueOpportunityV4[]> {
  if (!revenueV4Flags.revenueEngineV1) return [];

  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: { _count: { select: { buyerListingViews: true, leads: true } } },
  });
  if (!row || row.status !== "ACTIVE") return [];

  const out: RevenueOpportunityV4[] = [];
  const medianPeers = await prisma.fsboListing.findMany({
    where: {
      city: { equals: row.city, mode: "insensitive" },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      id: { not: listingId },
    },
    select: { priceCents: true },
    take: 200,
  });
  const prices = medianPeers.map((p) => p.priceCents).filter((p) => p > 0).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length >= 6 ? (prices.length % 2 ? prices[mid]! : Math.round((prices[mid - 1]! + prices[mid]!) / 2)) : null;

  if (median && median > 0) {
    const ratio = row.priceCents / median;
    if (ratio < 0.9) {
      out.push({
        type: "underpriced_vs_peers",
        score: 72,
        expectedRevenueLift: null,
        liftConfidence: "low",
        riskLevel: "medium",
        action: "review_list_price_increase",
        entityType: "fsbo_listing",
        entityId: listingId,
        explanation: [
          `Listed below peer median (ratio ${ratio.toFixed(2)}).`,
          "Expected lift not projected — depends on demand; confirm with broker/valuation if needed.",
        ],
      });
    } else if (ratio > 1.15) {
      out.push({
        type: "overpriced_vs_peers",
        score: 68,
        expectedRevenueLift: null,
        liftConfidence: "low",
        riskLevel: "medium",
        action: "review_list_price_decrease",
        entityType: "fsbo_listing",
        entityId: listingId,
        explanation: [`Listed above peer median (ratio ${ratio.toFixed(2)}).`, "May reduce inquiries — data-backed median only."],
      });
    }
  }

  if (row._count.buyerListingViews > 50 && row._count.leads === 0) {
    out.push({
      type: "high_traffic_low_conversion",
      score: 75,
      expectedRevenueLift: null,
      liftConfidence: "low",
      riskLevel: "high",
      action: "improve_conversion_or_adjust_price",
      entityType: "fsbo_listing",
      entityId: listingId,
      explanation: ["Many views but no leads — check price, photos, trust, contact path."],
    });
  }

  if (daysSince(row.updatedAt) > STALE_LISTING_DAYS) {
    out.push({
      type: "stale_listing_monetization",
      score: 55,
      expectedRevenueLift: null,
      liftConfidence: "low",
      riskLevel: "low",
      action: "suggest_promotional_discount_or_refresh",
      entityType: "fsbo_listing",
      entityId: listingId,
      explanation: [`No update in ${STALE_LISTING_DAYS}+ days — refresh content or test bounded price move.`],
    });
  }

  if (row.paidPublishAt && !row.featuredUntil) {
    out.push({
      type: "paid_not_featured",
      score: 48,
      expectedRevenueLift: null,
      liftConfidence: "low",
      riskLevel: "low",
      action: "suggest_upgrade_to_featured",
      entityType: "fsbo_listing",
      entityId: listingId,
      explanation: ["Paid publish without active featured window — optional featured upsell if policy allows."],
    });
  }

  await logRevenueEngineV4Event({
    engine: "revenue",
    action: "detect_fsbo_opportunities",
    entityType: "fsbo_listing",
    entityId: listingId,
    outputJson: { count: out.length, types: out.map((o) => o.type) },
    confidence: median ? 55 : 30,
    explanation: "Opportunity scan from platform comparables and engagement only.",
  });

  return out;
}
