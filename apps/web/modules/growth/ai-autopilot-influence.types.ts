/**
 * Advisory influence layer — suggestions only; never applied automatically.
 */

export type AiInfluenceTarget = "cro_ui" | "ads_strategy";

export type AiInfluenceImpact = "low" | "medium" | "high";

export type AiInfluenceSuggestion = {
  id: string;
  target: AiInfluenceTarget;
  title: string;
  description: string;
  impact: AiInfluenceImpact;
  /** 0–1 */
  confidence: number;
  reason: string;
  createdAt: string;
  /** Derived for sorting (aligns with autopilot priorityScore blend). */
  priorityScore: number;
};
