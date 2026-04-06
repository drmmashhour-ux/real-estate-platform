import { getPromotionCampaigns } from "@/lib/promotions";

export type AdminPromotionFilters = {
  marketId?: string;
};

/** Platform promotion campaigns (featured / sponsored / boost). */
export async function getAdminPromotions(filters: AdminPromotionFilters = {}) {
  return getPromotionCampaigns({
    limit: 100,
    ...(filters.marketId?.trim() ? { marketId: filters.marketId.trim() } : {}),
  });
}
