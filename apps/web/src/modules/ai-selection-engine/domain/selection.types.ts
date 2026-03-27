import type { ActionRecommendation, PropertySelectionCategory, StrategyRecommendation } from "@/src/modules/ai-selection-engine/domain/selection.enums";

export type SelectionOutput = {
  id: string;
  type: "property" | "lead" | "action" | "strategy";
  score: number;
  confidence: number;
  reasons: string[];
  recommendedAction: string;
};

export type PropertySelectionResult = SelectionOutput & {
  category: PropertySelectionCategory;
  listingId: string;
  city: string;
  priceCents: number;
  trustScore: number | null;
  dealScore: number | null;
};

export type LeadSelectionResult = SelectionOutput & {
  leadId: string;
  leadName: string;
  intentScore: number;
  responseLikelihood: number;
  dealSize: number;
  urgency: number;
};

export type ActionSelectionInput = {
  score: number | null;
  trustScore: number | null;
  riskScore: number | null;
  confidence: number | null;
  status?: string | null;
};

export type ActionSelectionResult = SelectionOutput & {
  action: ActionRecommendation;
};

export type StrategySelectionResult = SelectionOutput & {
  propertyId: string;
  strategy: StrategyRecommendation;
};
