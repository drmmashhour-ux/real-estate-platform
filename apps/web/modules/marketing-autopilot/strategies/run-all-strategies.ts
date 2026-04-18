import type { FsboListing } from "@prisma/client";
import { staleListingRevival } from "./stale-listing-revival.strategy";
import { newListingStrategy } from "./new-listing.strategy";
import { priceChangeStrategy } from "./price-change.strategy";
import { lowConversionListing } from "./low-conversion-listing.strategy";
import { highInterestListing } from "./high-interest-listing.strategy";
import { openHouseStrategy } from "./open-house.strategy";
import { mediaGapStrategy } from "./media-gap.strategy";
import { seoRefreshStrategy } from "./seo-refresh.strategy";

export type StrategySuggestion = {
  suggestionType: string;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  confidence: number;
  brokerApprovalRequired: boolean;
  whyNow: string;
  expectedBenefit: string;
  risksAndCautions: string;
};

export function runResidentialMarketingStrategies(ctx: {
  listing: Pick<FsboListing, "id" | "title" | "city" | "createdAt" | "images" | "description" | "status" | "priceCents">;
  signals: { views: number; inquiries: number; daysOnMarket: number };
}): StrategySuggestion[] {
  return [
    ...newListingStrategy(ctx),
    ...staleListingRevival(ctx),
    ...priceChangeStrategy(ctx),
    ...lowConversionListing(ctx),
    ...highInterestListing(ctx),
    ...openHouseStrategy(ctx),
    ...mediaGapStrategy(ctx),
    ...seoRefreshStrategy(ctx),
  ];
}
