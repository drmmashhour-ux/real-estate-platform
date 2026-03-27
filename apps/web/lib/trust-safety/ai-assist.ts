/**
 * AI assistance for Trust & Safety: classify category, estimate severity, suggest action.
 * Recommendations are advisory; high-risk enforcement remains human-reviewable.
 */

import type { IncidentCategory, SeverityLevel } from "./engine-constants";

export interface ClassifyIncidentInput {
  description: string;
  evidenceUrls?: string[];
}

export interface ClassifyIncidentResult {
  suggestedCategory: IncidentCategory;
  suggestedSeverity: SeverityLevel;
  confidence: number;
}

/** Stub: in production, call ML model or external API. */
export async function classifyIncident(_input: ClassifyIncidentInput): Promise<ClassifyIncidentResult> {
  return {
    suggestedCategory: "other",
    suggestedSeverity: "MEDIUM",
    confidence: 0.5,
  };
}

export interface SuggestEnforcementInput {
  incidentCategory: string;
  severityLevel: string;
  riskScore?: number;
  repeatOffender?: boolean;
}

export interface SuggestEnforcementResult {
  suggestedActions: string[];
  suggestedReasonCode: string;
  priority: "low" | "medium" | "high" | "urgent";
}

/** Stub: suggest likely enforcement action from incident context. */
export async function suggestEnforcement(_input: SuggestEnforcementInput): Promise<SuggestEnforcementResult> {
  return {
    suggestedActions: ["WARNING", "MANUAL_REVIEW_REQUIRED"],
    suggestedReasonCode: "POLICY_VIOLATION",
    priority: "medium",
  };
}
