import type { LeadLocation } from "./lead-location.types";

export type LeadEnrichmentIntent = "buy" | "sell" | "rent" | "invest" | "host" | "unknown";

export type LeadEnrichmentUrgency = "low" | "medium" | "high";

/** Normalized intake snapshot for routing — no guessed dollar amounts or fake addresses. */
export type LeadEnrichment = {
  location: LeadLocation;
  intent: LeadEnrichmentIntent;
  urgency: LeadEnrichmentUrgency;
  budgetRange?: string | null;
  propertyType?: string | null;
  language?: string | null;
  timeframe?: string | null;
  /** 0–1 based on how many optional fields are honestly present */
  completenessScore: number;
};
