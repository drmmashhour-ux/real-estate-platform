/** Listing marketing drafts — mirrored channel/status enums + row shape for UI. */

export type ListingMarketingContentStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"
  | "archived";

export type ListingMarketingDraftChannel =
  | "email"
  | "sms_short"
  | "social_post"
  | "listing_page"
  | "ad_copy"
  | "internal_brief";

export type ListingMarketingDraftView = {
  id: string;
  draftType: string;
  channel: ListingMarketingDraftChannel | string;
  status: ListingMarketingContentStatus | string;
  body: string;
};
