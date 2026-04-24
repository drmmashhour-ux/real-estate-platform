import type { RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";

function toBand(n: number | null | undefined): "small" | "medium" | "large" | "unknown" {
  if (n == null || !Number.isFinite(n)) {
    return "unknown";
  }
  if (n <= 2) {
    return "small";
  }
  if (n <= 4) {
    return "medium";
  }
  return "large";
}

/**
 * Normalized, explicit user-declared context for Dream Home. No protected-trait fields.
 */
export async function buildDreamHomeContext(
  input: unknown,
): Promise<Record<string, string | number | boolean | null>> {
  try {
    const c = input as Partial<RecommendationRequestContext>;
    if (!c || typeof c !== "object") {
      return {};
    }
    const seg = c.segment && typeof c.segment === "object" && !Array.isArray(c.segment) ? c.segment : {};
    const sig = c.signals && typeof c.signals === "object" && !Array.isArray(c.signals) ? c.signals : {};
    const s = seg as Record<string, unknown>;
    const g = sig as Record<string, unknown>;
    const fam = s["familySize"] != null ? Number(s["familySize"]) : s["householdSize"] != null ? Number(s["householdSize"]) : null;
    const wfh = s["workFromHome"] != null ? String(s["workFromHome"]) : g["workFromHome"] != null ? String(g["workFromHome"]) : null;
    const workFromHomeLevel =
      wfh === "full_time" ? "full" : wfh === "sometimes" ? "partial" : wfh === "none" || wfh == null ? "none" : "unknown";
    const spec = s["specialSpaces"] != null && Array.isArray(s["specialSpaces"]) ? (s["specialSpaces"] as string[]).length : 0;
    const a11n =
      s["accessibilityNeeds"] != null && Array.isArray(s["accessibilityNeeds"])
        ? (s["accessibilityNeeds"] as string[]).length
        : 0;
    return {
      familySize: fam,
      familySizeBand: toBand(fam),
      adultsCount: s["adultsCount"] != null ? Number(s["adultsCount"]) : null,
      childrenCount: s["childrenCount"] != null ? Number(s["childrenCount"]) : null,
      eldersInHome: s["eldersInHome"] === true || s["eldersInHome"] === "true",
      guestsFrequency: s["guestsFrequency"] != null ? String(s["guestsFrequency"]) : null,
      workFromHome: wfh,
      workFromHomeLevel,
      budgetMin: s["budgetMin"] != null ? Number(s["budgetMin"]) : null,
      budgetMax: s["budgetMax"] != null ? Number(s["budgetMax"]) : s["maxBudget"] != null ? Number(s["maxBudget"]) : null,
      budgetBand: s["budgetBand"] != null ? String(s["budgetBand"]) : null,
      purchaseIntent: s["transactionType"] != null ? String(s["transactionType"]) : null,
      city: s["city"] != null ? String(s["city"]) : null,
      neighborhoods: s["neighborhoods"] != null ? String(s["neighborhoods"]) : null,
      radiusKm: s["radiusKm"] != null ? Number(s["radiusKm"]) : null,
      commutePriority: s["commutePriority"] != null ? String(s["commutePriority"]) : null,
      privacyLevel: s["privacyPreference"] != null ? String(s["privacyPreference"]) : null,
      privacyPreference: s["privacyPreference"] != null ? String(s["privacyPreference"]) : null,
      hostingLevel: s["hostingPreference"] != null ? String(s["hostingPreference"]) : null,
      hostingPreference: s["hostingPreference"] != null ? String(s["hostingPreference"]) : null,
      spaceNeedsScore: spec + (s["mustHaves"] != null && Array.isArray(s["mustHaves"]) ? (s["mustHaves"] as string[]).length * 0.2 : 0),
      kitchenPriority: s["kitchenPriority"] != null ? String(s["kitchenPriority"]) : null,
      outdoorPriority: s["outdoorPriority"] != null ? String(s["outdoorPriority"]) : null,
      noiseTolerance: s["noiseTolerance"] != null ? String(s["noiseTolerance"]) : null,
      locationIntent: s["transactionType"] != null ? `transaction:${String(s["transactionType"])}` : "unknown",
      accessibilityLevel: a11n > 0 ? a11n : s["accessibilityNeeds"] != null && typeof s["accessibilityNeeds"] === "string" ? 1 : 0,
      designPreferenceTags: s["stylePreferences"] != null && Array.isArray(s["stylePreferences"])
        ? String(s["stylePreferences"].slice(0, 6))
        : s["styleTags"] != null
          ? String(s["styleTags"])
          : null,
      lifestyleTags: s["lifestyleTags"] != null ? String(s["lifestyleTags"]) : null,
      pets: s["pets"] === true,
      styleTags: s["styleTags"] != null ? String(s["styleTags"]) : null,
      minBedrooms: s["minBedrooms"] != null ? Number(s["minBedrooms"]) : null,
      mustHaves: s["mustHaves"] != null ? String(s["mustHaves"]) : null,
    };
  } catch {
    return {};
  }
}
