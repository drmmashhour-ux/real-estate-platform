import type { GeneratedListingContent, ListingLanguage } from "@/modules/listing-assistant/listing-assistant.types";

/** Persisted workflow phases — advisory only; broker publishes through existing CRM gates. */
export type ListingAssistantVersionPhase = "ORIGINAL" | "AI_GENERATED" | "BROKER_EDITED" | "SAVED_DRAFT";

export type ListingAssistantContentSource = "AI_ASSISTANT" | "BROKER_MANUAL" | "SYSTEM";

/** Canonical JSON shape stored in `ListingAssistantContentVersion.content` and `Listing.assistantDraftContent`. */
export type ListingAssistantContentSnapshot = {
  title: string;
  description: string;
  propertyHighlights: string[];
  language: ListingLanguage;
  amenities?: string[];
  zoningNotes?: string;
};

export type ListingContentDiffField = "title" | "description" | "highlights";

export type ListingContentDiffSegment = {
  field: ListingContentDiffField;
  kind: "unchanged" | "added" | "removed" | "changed";
  /** Human-readable summary (not a full Myers diff — keeps assistive UX simple). */
  summary: string;
  /** Optional line-level detail for description. */
  linesChangedEstimate?: number;
};

export type ListingVersionCompareResult = {
  fromLabel: string;
  toLabel: string;
  segments: ListingContentDiffSegment[];
  /** 0–1 rough magnitude of change */
  changeMagnitude: number;
};

export type SerializedListingAssistantVersion = {
  id: string;
  listingId: string;
  phase: ListingAssistantVersionPhase;
  source: ListingAssistantContentSource;
  content: ListingAssistantContentSnapshot;
  actorUserId: string | null;
  createdAt: string;
};

/** Maps generated bundle slice into a snapshot for persistence / compare. */
export function snapshotFromGeneratedContent(content: GeneratedListingContent): ListingAssistantContentSnapshot {
  return {
    title: content.title,
    description: content.description,
    propertyHighlights: content.propertyHighlights,
    language: content.language,
    amenities: content.amenities,
    zoningNotes: content.zoningNotes,
  };
}
