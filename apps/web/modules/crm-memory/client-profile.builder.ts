import type { ExtractedPreferences } from "@/modules/crm-memory/preference.extractor";

export type ClientProfileCard = {
  budget: string | null;
  preferredArea: string | null;
  type: string | null;
};

export function buildClientProfile(
  extracted: ExtractedPreferences,
  storedPrefs: Record<string, unknown> | null
): ClientProfileCard {
  const sp = storedPrefs && typeof storedPrefs === "object" ? storedPrefs : {};
  const budget =
    typeof sp.budget === "string" && sp.budget.trim()
      ? sp.budget.trim()
      : extracted.budgetLabel;
  const preferredArea =
    typeof sp.preferredArea === "string" && sp.preferredArea.trim()
      ? sp.preferredArea.trim()
      : extracted.preferredArea;
  const type =
    typeof sp.propertyType === "string" && sp.propertyType.trim()
      ? sp.propertyType.trim()
      : extracted.propertyType;

  return {
    budget: budget ?? null,
    preferredArea: preferredArea ?? null,
    type: type ?? null,
  };
}
