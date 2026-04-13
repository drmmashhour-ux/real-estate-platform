import type { ListingAutopilotMode, OptimizationRiskLevel } from "@prisma/client";

export const FIELD_TITLE = "title";
export const FIELD_DESCRIPTION = "description";
export const FIELD_SUBTITLE_CTA = "subtitle_cta";
export const FIELD_PHOTO_ORDER = "photo_order";
export const FIELD_NIGHT_PRICE_CENTS = "night_price_cents";

export const LOW_RISK_FIELDS = new Set([
  FIELD_TITLE,
  FIELD_DESCRIPTION,
  FIELD_SUBTITLE_CTA,
  FIELD_PHOTO_ORDER,
]);

export function riskForFieldType(fieldType: string): OptimizationRiskLevel {
  if (fieldType === FIELD_NIGHT_PRICE_CENTS) return "high";
  if (fieldType === FIELD_PHOTO_ORDER || fieldType === FIELD_TITLE || fieldType === FIELD_DESCRIPTION) return "low";
  if (fieldType === FIELD_SUBTITLE_CTA) return "low";
  return "medium";
}

export function canAutoApplyField(
  mode: ListingAutopilotMode,
  fieldType: string,
  risk: OptimizationRiskLevel,
  settings: {
    autoFixTitles: boolean;
    autoFixDescriptions: boolean;
    autoReorderPhotos: boolean;
    autoGenerateContent: boolean;
    allowPriceSuggestions: boolean;
  }
): boolean {
  if (mode !== "safe_autopilot") return false;
  if (risk !== "low") return false;
  if (fieldType === FIELD_TITLE && !settings.autoFixTitles) return false;
  if (fieldType === FIELD_DESCRIPTION && !settings.autoFixDescriptions) return false;
  if (fieldType === FIELD_SUBTITLE_CTA && !settings.autoGenerateContent) return false;
  if (fieldType === FIELD_PHOTO_ORDER && !settings.autoReorderPhotos) return false;
  if (fieldType === FIELD_NIGHT_PRICE_CENTS) return false;
  return LOW_RISK_FIELDS.has(fieldType);
}

export function shouldQueueAllForApproval(mode: ListingAutopilotMode): boolean {
  return mode === "approval_required";
}
