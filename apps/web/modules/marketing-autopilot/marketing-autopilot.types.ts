import type { ListingMarketingDraftChannel } from "@prisma/client";

export type MarketingAutopilotOutputType =
  | "new_listing_announcement"
  | "price_update"
  | "open_house_promo"
  | "just_listed"
  | "back_on_market"
  | "listing_refresh"
  | "feature_highlight"
  | "email_blast"
  | "sms_lead_update"
  | "social_caption"
  | "ad_headline_variants"
  | "seo_listing_page";

export type MarketingAutopilotDraftPlan = {
  outputType: MarketingAutopilotOutputType;
  channel: ListingMarketingDraftChannel;
  draftType: string;
  title?: string;
  subject?: string;
  body: string;
  metadata: Record<string, unknown>;
};
