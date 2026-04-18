import type { ListingMarketingContentStatus, ListingMarketingDraftChannel } from "@prisma/client";

export type { ListingMarketingContentStatus, ListingMarketingDraftChannel };

export type MarketingDraftPayload = {
  draftType: string;
  channel: ListingMarketingDraftChannel;
  title?: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
};
