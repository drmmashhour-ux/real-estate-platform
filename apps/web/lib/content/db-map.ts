import type {
  ContentEntityType,
  ContentLocale,
  ContentStatus,
  ContentSurface,
  GeneratedContentRecord,
  GenerationSource,
  HostContentOverwritePreference,
  ContentCreationMode,
} from "./types";
import type { LecipmGeneratedContent } from "@prisma/client";

const SURFACES: ContentSurface[] = [
  "listing_title",
  "listing_description",
  "listing_seo_meta",
  "city_landing_page",
  "neighborhood_landing_page",
  "host_recommendation",
  "email_campaign",
  "notification",
  "market_banner",
  "faq_answer",
];

const LOCALES: ContentLocale[] = ["en", "fr", "ar"];
const STATUSES: ContentStatus[] = ["draft", "pending_review", "approved", "rejected", "published"];
const ENTITY: ContentEntityType[] = ["listing", "city", "campaign", "system"];
const GEN: GenerationSource[] = ["ai", "template", "hybrid"];
const MODES: ContentCreationMode[] = ["generate_native", "translate_from_source", "hybrid_localize"];
const HOST_POL: HostContentOverwritePreference[] = [
  "append_suggestion",
  "replace_ai_field_only",
  "manual_review_required",
];

function asSurface(s: string): ContentSurface {
  return (SURFACES as string[]).includes(s) ? (s as ContentSurface) : "listing_description";
}

function asLocale(s: string): ContentLocale {
  return (LOCALES as string[]).includes(s) ? (s as ContentLocale) : "en";
}

function asStatus(s: string): ContentStatus {
  return (STATUSES as string[]).includes(s) ? (s as ContentStatus) : "draft";
}

function asEntity(s: string): ContentEntityType {
  return (ENTITY as string[]).includes(s) ? (s as ContentEntityType) : "system";
}

function asGen(s: string): GenerationSource {
  return (GEN as string[]).includes(s) ? (s as GenerationSource) : "template";
}

function asMode(s: string | null | undefined): ContentCreationMode | null {
  if (!s) return null;
  return (MODES as string[]).includes(s) ? (s as ContentCreationMode) : null;
}

function asHostPol(s: string | null | undefined): HostContentOverwritePreference | null {
  if (!s) return null;
  return (HOST_POL as string[]).includes(s) ? (s as HostContentOverwritePreference) : null;
}

export function mapRowToGeneratedContentRecord(row: LecipmGeneratedContent): GeneratedContentRecord {
  return {
    id: row.id,
    surface: asSurface(row.surface),
    locale: asLocale(row.locale),
    marketCode: row.marketCode,
    entityType: asEntity(row.entityType),
    entityId: row.entityId,
    title: row.title,
    body: row.body,
    summary: row.summary,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    status: asStatus(row.status),
    createdByUserId: row.createdByUserId,
    createdBySystem: row.createdBySystem,
    generationSource: asGen(row.generationSource),
    promptVersion: row.promptVersion,
    creationMode: asMode(row.creationMode),
    sourceContentId: row.sourceContentId,
    reviewedByUserId: row.reviewedByUserId,
    reviewedAt: row.reviewedAt,
    publishedByUserId: row.publishedByUserId,
    publishedAt: row.publishedAt,
    hostOverwritePolicy: asHostPol(row.hostOverwritePolicy),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
