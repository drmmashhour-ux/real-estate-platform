import { revenueV4Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { estimateRentalYield } from "./roi-calculator";

export type PortfolioBand = "top" | "mid" | "tail";

export type PortfolioListingInsight = {
  listingId: string;
  city: string;
  band: PortfolioBand;
  note: string;
};

/**
 * Owner portfolio triage from platform fields — not appraisal.
 */
export async function analyzeOwnerFsboPortfolio(ownerId: string, limit = 30): Promise<PortfolioListingInsight[]> {
  if (!revenueV4Flags.investorInsightsV1) return [];

  const rows = await prisma.fsboListing.findMany({
    where: { ownerId },
    select: {
      id: true,
      city: true,
      priceCents: true,
      trustScore: true,
      updatedAt: true,
      annualTaxesCents: true,
      condoFeesCents: true,
      listingDealType: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const insights: PortfolioListingInsight[] = [];
  for (const r of rows) {
    let band: PortfolioBand = "mid";
    let note = "Review listing freshness and trust.";
    if (r.trustScore != null && r.trustScore > 75) {
      band = "top";
      note = "Higher trust score — candidate for premium placement tests (policy gated).";
    } else if (r.trustScore != null && r.trustScore < 45) {
      band = "tail";
      note = "Lower trust — prioritize verification before monetization.";
    }
    const y = estimateRentalYield({
      purchasePriceCents: r.priceCents,
      monthlyRentCents: r.listingDealType === "RENT" ? r.priceCents : null,
      annualTaxesCents: r.annualTaxesCents,
      annualMaintenanceCents: r.condoFeesCents,
    });
    if (y.netYieldAnnualPct != null) {
      note += ` Net yield (rough): ${y.netYieldAnnualPct.toFixed(2)}% — ${y.disclaimer}`;
    }
    insights.push({ listingId: r.id, city: r.city, band, note });
  }

  return insights;
}
