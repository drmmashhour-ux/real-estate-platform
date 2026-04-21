import { prisma } from "@/lib/db";
import {
  complianceCheckDraft,
  generateListingAssistantDraft,
  pricingSuggestionForListing,
} from "@/modules/listing-assistant/listing-assistant.engine";
import { logListingAssistant } from "@/modules/listing-assistant/listing-assistant.log";
import type { ListingPropertyPartial } from "@/modules/listing-assistant/listing-assistant.types";

async function mergeListingIntoPartial(
  listingId: string,
  partial: ListingPropertyPartial,
): Promise<ListingPropertyPartial> {
  const l = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      price: true,
      listingType: true,
    },
  });
  if (!l) return partial;
  return {
    ...partial,
    title: partial.title ?? l.title,
    priceMajor: partial.priceMajor ?? l.price,
    listingType: partial.listingType ?? l.listingType,
  };
}

/**
 * Full generation for dashboard / API — **assistive only**; never persists or syndicates automatically.
 */
export async function listingAssistantGenerateService(params: {
  listingId?: string | null;
  partial?: ListingPropertyPartial;
  language?: string;
}) {
  logListingAssistant("generate_requested", {
    listingId: params.listingId ?? null,
    language: params.language ?? "en",
  });
  let merged: ListingPropertyPartial = { ...params.partial };
  if (params.listingId) {
    merged = await mergeListingIntoPartial(params.listingId, merged);
  }
  return generateListingAssistantDraft(merged, params.language);
}

export async function listingAssistantComplianceService(params: {
  title?: string;
  description?: string;
  highlights?: string[];
}) {
  return complianceCheckDraft(params);
}

export async function listingAssistantPricingService(params: {
  listingId?: string | null;
  listingType?: string;
  currentPriceMajor?: number | null;
}) {
  let listingType = params.listingType ?? "HOUSE";
  let priceMajor = params.currentPriceMajor ?? null;

  if (params.listingId) {
    const l = await prisma.listing.findUnique({
      where: { id: params.listingId },
      select: { listingType: true, price: true },
    });
    if (l) {
      listingType = l.listingType;
      if (priceMajor == null) priceMajor = l.price;
    }
  }

  logListingAssistant("pricing_requested", { listingId: params.listingId ?? null });
  return pricingSuggestionForListing({ listingType, currentPriceMajor: priceMajor });
}
