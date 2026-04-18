import type { LecipmCoreAutopilotExecutionMode } from "@/src/modules/autopilot/types";

export type AutopilotV2Trigger =
  | "listing_created"
  | "listing_updated"
  | "low_views_detected"
  | "low_conversion_detected"
  | "price_gap_detected"
  | "demand_spike_detected"
  | "booking_gap_detected";

export type AutopilotV2ActionType =
  | "improve_title"
  | "improve_description"
  | "add_missing_photos"
  | "adjust_price"
  | "add_promotion"
  | "optimize_availability"
  | "highlight_features";

export type AutopilotV2ActionPayload = {
  type: AutopilotV2ActionType;
  impactEstimate: number;
  confidence: number;
  explanation: string[];
  suggestedChange: Record<string, unknown>;
  autoApplicable: boolean;
};

export type AutopilotV2RunContext = {
  mode: LecipmCoreAutopilotExecutionMode;
  listingId: string;
  triggers: AutopilotV2Trigger[];
};
