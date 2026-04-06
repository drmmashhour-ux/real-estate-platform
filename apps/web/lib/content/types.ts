/**
 * Multilingual content engine types (EN default, FR/AR first-class).
 * Persisted rows use Prisma `LecipmGeneratedContent`; this is the domain shape.
 */

export type ContentLocale = "en" | "fr" | "ar";

export type ContentSurface =
  | "listing_title"
  | "listing_description"
  | "listing_seo_meta"
  | "city_landing_page"
  | "neighborhood_landing_page"
  | "host_recommendation"
  | "email_campaign"
  | "notification"
  | "market_banner"
  | "faq_answer";

export type ContentStatus = "draft" | "pending_review" | "approved" | "rejected" | "published";

export type ContentEntityType = "listing" | "city" | "campaign" | "system";

export type GenerationSource = "ai" | "template" | "hybrid";

export type ContentCreationMode = "generate_native" | "translate_from_source" | "hybrid_localize";

/** How host listing fields may be updated from generated copy */
export type HostContentOverwritePreference =
  | "append_suggestion"
  | "replace_ai_field_only"
  | "manual_review_required";

export interface GeneratedContentRecord {
  id: string;
  surface: ContentSurface;
  locale: ContentLocale;
  marketCode: string;
  entityType: ContentEntityType;
  entityId: string | null;
  title: string | null;
  body: string;
  summary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ContentStatus;
  createdByUserId: string | null;
  createdBySystem: boolean;
  generationSource: GenerationSource;
  promptVersion: string | null;
  creationMode: ContentCreationMode | null;
  sourceContentId: string | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  publishedByUserId: string | null;
  publishedAt: Date | null;
  hostOverwritePolicy: HostContentOverwritePreference | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentTone = "professional" | "luxury" | "friendly" | "conversion";

export interface GenerateContentInput {
  locale: ContentLocale;
  marketCode: string;
  surface: ContentSurface;
  tone: ContentTone;
  entity: Record<string, unknown>;
  userFacingContext?: Record<string, unknown>;
}

export interface MarketContentConstraints {
  marketCode: string;
  contactFirst: boolean;
  manualPaymentEmphasis: boolean;
  onlinePaymentsEnabled: boolean;
}
