import { revenueV4Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { logRevenueEngineV4Event } from "@/src/modules/revenue/revenue.logger";
import { estimateRentalYield } from "./roi-calculator";

export type ListingInvestorSnapshot = {
  listingId: string;
  city: string;
  priceCents: number;
  yieldEstimate: ReturnType<typeof estimateRentalYield>;
};

/**
 * Aggregates observable listing economics — no fabricated comps.
 */
export async function buildInvestorSnapshotForFsboListing(listingId: string): Promise<ListingInvestorSnapshot | null> {
  if (!revenueV4Flags.investorInsightsV1) return null;

  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      city: true,
      priceCents: true,
      annualTaxesCents: true,
      condoFeesCents: true,
      listingDealType: true,
    },
  });
  if (!row) return null;

  const monthlyRentCents = row.listingDealType === "RENT" ? row.priceCents : null;
  const yieldEstimate = estimateRentalYield({
    purchasePriceCents: row.priceCents,
    monthlyRentCents,
    annualTaxesCents: row.annualTaxesCents,
    annualMaintenanceCents: row.condoFeesCents,
  });

  const snap: ListingInvestorSnapshot = {
    listingId,
    city: row.city,
    priceCents: row.priceCents,
    yieldEstimate,
  };

  await logRevenueEngineV4Event({
    engine: "investor",
    action: "snapshot_fsbo",
    entityType: "fsbo_listing",
    entityId: listingId,
    outputJson: snap as unknown as Record<string, unknown>,
    confidence: 40,
    explanation: yieldEstimate.disclaimer,
  });

  return snap;
}
