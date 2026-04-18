import { computeListingMarketingIntelligence } from "@/modules/listing-marketing-intelligence/listing-marketing-intelligence.service";
import { countHotLeadsForListing } from "./crm-marketing-linker.service";

export async function buildListingGrowthLinkage(input: { brokerId: string; listingId: string }) {
  const intel = await computeListingMarketingIntelligence(input);
  const hotLeads = await countHotLeadsForListing({ brokerId: input.brokerId, fsboListingId: input.listingId });
  return {
    intelligenceAvailable: intel != null,
    hotLeadCount: hotLeads,
    stopPaidPromotion: intel?.warnings.some((w) => /not active|inactive/i.test(w)) ?? false,
  };
}
