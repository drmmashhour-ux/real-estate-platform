/**
 * Client-safe BNHUB star classification shapes — mirrored from growth engine scoring types.
 * Use this instead of importing from `propertyClassificationService` where `@/lib/db` must not resolve.
 */

export type ClassificationBreakdownCore = {
  label: string;
  amenities: { earned: number; max: number; items: Record<string, boolean> };
  comfort: { earned: number; max: number; items: Record<string, boolean> };
  services: { earned: number; max: number; items: Record<string, boolean> };
  safety: { earned: number; max: number; items: Record<string, boolean> };
  completeness: { earned: number; max: number; items: Record<string, boolean> };
  luxury: { earned: number; max: number; items: Record<string, boolean> };
  aiAdjustment: { value: number; signals: string[] };
  baseScore: number;
  overallScore: number;
  starRating: number;
};

export type ClassificationBreakdown = ClassificationBreakdownCore & {
  improvementSuggestions: string[];
};
