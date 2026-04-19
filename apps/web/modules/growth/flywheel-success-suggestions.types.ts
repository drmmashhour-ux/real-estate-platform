import type { MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";

export type GrowthActionSuccessProfile = {
  actionType: string;
  totalActions: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  insufficientCount: number;
  successRate: number | null;
  confidenceLevel: "low" | "medium" | "high";
  lastMeasuredAt?: string | null;
  notes: string[];
};

export type GrowthActionSuggestion = {
  id: string;
  actionType: string;
  title: string;
  description: string;
  successRate: number | null;
  confidenceLevel: "low" | "medium" | "high";
  recommendedNow: boolean;
  rationale: string;
  constraints: string[];
  relatedInsightType?: MarketplaceFlywheelInsightType | null;
  ownerArea: "growth_ops" | "broker_success" | "product" | "monetization";
};

export type GrowthActionSuggestionBundle = {
  suggestions: GrowthActionSuggestion[];
  generatedAt: string;
  warnings: string[];
};
