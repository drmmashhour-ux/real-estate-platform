/**
 * Draft-only content assist for growth — never auto-published; human review required.
 */

export type AiContentDraftType = "ad_copy" | "listing_copy" | "outreach_copy";

export type AiContentVariant = "short" | "standard" | "long";

export type AiContentTone = "friendly" | "professional" | "high-conversion";

export type AiContentDraft = {
  id: string;
  type: AiContentDraftType;
  title?: string;
  body: string;
  variant: AiContentVariant;
  tone: AiContentTone;
  rationale: string;
  createdAt: string;
};

export type GrowthContentHubSnapshot = {
  listing?: {
    title?: string;
    description?: string;
    city?: string;
    propertyType?: string;
    highlights?: string[];
  };
  campaign?: {
    name?: string;
    utmCampaign?: string;
    medium?: string;
  };
  /** e.g. high_intent, investor, seller */
  leadSegment?: string;
};
