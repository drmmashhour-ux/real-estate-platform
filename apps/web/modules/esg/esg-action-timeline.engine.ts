import type { EsgActionCategory, EsgActionType } from "./esg-action.types";

/** Timeline bands per spec */
export const TIMELINE_LT30 = "<30D";
export const TIMELINE_1_3M = "1-3M";
export const TIMELINE_3_6M = "3-6M";
export const TIMELINE_6_12M = "6-12M";
export const TIMELINE_12M_PLUS = "12M+";

export function estimateTimelineBand(input: {
  category: EsgActionCategory;
  actionType: EsgActionType;
  reasonCode: string;
}): string {
  if (
    input.actionType === "DOCUMENTATION" ||
    input.reasonCode.startsWith("EVIDENCE_") ||
    input.reasonCode.includes("UPLOAD") ||
    input.reasonCode.includes("DISCLOSURE_PACKET")
  ) {
    return TIMELINE_LT30;
  }

  if (input.reasonCode.includes("AUDIT") || input.reasonCode.includes("CLIMATE_PLAN")) {
    return TIMELINE_1_3M;
  }

  if (input.reasonCode.includes("METERING") || input.reasonCode.includes("MAINTENANCE")) {
    return TIMELINE_3_6M;
  }

  if (input.category === "ENERGY" && input.actionType === "CAPEX") {
    if (input.reasonCode.includes("ENVELOPE")) return TIMELINE_12M_PLUS;
    if (input.reasonCode.includes("HEAT_PUMP") || input.reasonCode.includes("SOLAR")) return TIMELINE_6_12M;
    return TIMELINE_6_12M;
  }

  if (input.actionType === "STRATEGIC") return TIMELINE_1_3M;

  return TIMELINE_3_6M;
}
