/**
 * Structured location for routing — only populated from explicit input or cautious inference.
 */

export type LeadLocationConfidenceLevel = "low" | "medium" | "high";

export type LeadLocationSource = "user_input" | "inferred" | "partial";

/** Geographic hint for a lead — missing fields stay undefined; never fabricated. */
export type LeadLocation = {
  country?: string | null;
  province?: string | null;
  city?: string | null;
  area?: string | null;
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  confidenceLevel: LeadLocationConfidenceLevel;
  source: LeadLocationSource;
};
