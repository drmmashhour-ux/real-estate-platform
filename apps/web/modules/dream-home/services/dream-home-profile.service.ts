import { logDreamHomeProfileGenerated } from "./dream-home-playbook-memory.service";
import type { DreamHomeIntake, DreamHomeProfile, DreamHomeQuestionnaireInput } from "../types/dream-home.types";
import { buildDefaultRankingPreferences, suggestBedroomBathMinimums } from "../utils/dream-home-scoring";
import { buildDreamHomeTradeoffs } from "../utils/dream-home-tradeoffs";
import {
  legacyIntakeToQuestionnaire,
  normalizeIntake,
  normalizeQuestionnaire,
} from "../utils/dream-home-normalize";

/**
 * v1: deterministic profile from user-provided fields only. No LLM, no protected-trait inference.
 * Never throws.
 */
export function generateProfile(q: DreamHomeQuestionnaireInput, intakeFallback?: DreamHomeIntake): DreamHomeProfile {
  const family = q.familySize ?? intakeFallback?.householdSize ?? 2;
  const { minBedrooms, minBathrooms } = suggestBedroomBathMinimums({
    familySize: family,
    childrenCount: q.childrenCount,
    eldersInHome: q.eldersInHome,
    guestsFrequency: q.guestsFrequency,
  });
  const maxBudget = q.budgetMax ?? (intakeFallback?.maxBudget != null ? intakeFallback.maxBudget : undefined);
  const minBudget = q.budgetMin;
  const city = q.city ?? intakeFallback?.city;
  const ranking = buildDefaultRankingPreferences({
    ...q,
    familySize: family,
  });
  const tradeoffs = buildDreamHomeTradeoffs(q);
  const wfh = q.workFromHome ?? (intakeFallback?.workFromHome ? "sometimes" : "none");
  const special = (q.specialSpaces ?? []).length
    ? `User-listed space interests: ${(q.specialSpaces ?? []).join(", ")}.`
    : null;
  const must = (q.mustHaves ?? []).length ? `Stated must-haves: ${(q.mustHaves ?? []).join("; ")}.` : null;
  const warn: string[] = [];
  if (maxBudget == null || maxBudget <= 0) {
    warn.push("Add a clear budget (min/max) in your currency to tighten matches.");
  }
  if (!city?.trim()) {
    warn.push("City or area not set — location-based matching stays broad.");
  }
  if ((q.dealBreakers?.length ?? 0) > 0) {
    warn.push("Review listings against your stated deal-breakers manually; automated checks are limited to text and filters.");
  }
  const householdProfile = `Household: ${family} people (declared)${q.childrenCount != null ? `, ${q.childrenCount} children noted` : ""}. Work from home: ${wfh}. Hosting frequency: ${q.guestsFrequency ?? "not specified"}. ${special ?? ""} ${must ?? ""}`.trim();
  const propertyTraits: string[] = [];
  if (wfh === "full_time" || wfh === "sometimes") {
    propertyTraits.push("Space for a dedicated or quiet workspace (from your WFH answer)");
  }
  if (q.hostingPreference === "high" || q.guestsFrequency === "high") {
    propertyTraits.push("Layout suited to guests: generous kitchen and gathering space (from your hosting/guest answers)");
  }
  if (q.privacyPreference === "high") {
    propertyTraits.push("Separation of spaces / quieter zones (from your privacy setting)");
  }
  if (q.pets) {
    propertyTraits.push("Pet-friendly practical features (from your pet answer)");
  }
  if (q.outdoorPriority === "high") {
    propertyTraits.push("Outdoor or yard/terrace priority (from your outdoor priority)");
  }
  if (q.kitchenPriority === "high" || (q.hostingPreference === "high" && (q.guestsFrequency === "high" || q.guestsFrequency === "medium"))) {
    propertyTraits.push("Strong kitchen and dining flow (from your kitchen/hosting settings)");
  }
  if (Array.isArray(q.accessibilityNeeds) && q.accessibilityNeeds.length) {
    propertyTraits.push("Accessibility and mobility considerations (from your list)");
  }
  if (q.stylePreferences?.length) {
    propertyTraits.push(`Style cues you provided: ${q.stylePreferences.slice(0, 6).join(", ")}`);
  }
  if (propertyTraits.length === 0) {
    propertyTraits.push("Adaptable layout — refine the wizard to add more must-haves.");
  }
  const neighborhoodTraits: string[] = [];
  if (city?.trim()) {
    neighborhoodTraits.push(`Search centered on ${String(city).trim()}`);
  } else {
    neighborhoodTraits.push("Set a city to sharpen neighborhood and commute fit.");
  }
  if (q.commutePriority === "high") {
    neighborhoodTraits.push("Commute is a high priority — verify travel times to your destinations.");
  }
  if (q.noiseTolerance === "high") {
    neighborhoodTraits.push("Favoring quieter context where possible (per your noise preference).");
  }

  const lifestyleTags: string[] = [
    ...(Array.isArray(q.lifestyleTags) ? q.lifestyleTags.filter((t) => typeof t === "string" && t.trim()) : []),
  ];
  if (q.workFromHome && q.workFromHome !== "none") {
    lifestyleTags.push(`wfh_${q.workFromHome}`);
  }
  if (q.guestsFrequency) {
    lifestyleTags.push(`guests_${q.guestsFrequency}`);
  }
  if (q.hostingPreference) {
    lifestyleTags.push(`hosting_${q.hostingPreference}`);
  }
  const uniqueLifestyle = [...new Set(lifestyleTags.map((t) => t.trim()).filter(Boolean))].slice(0, 32);

  const searchFilters: DreamHomeProfile["searchFilters"] = {
    minBedrooms: minBedrooms,
    minBathrooms: minBathrooms,
    bedroomsMin: minBedrooms,
    bathroomsMin: minBathrooms,
    budgetMin: minBudget,
    budgetMax: maxBudget,
    maxBudget: maxBudget,
    city: city?.trim() || undefined,
    neighborhoods: q.neighborhoods,
    maxCommuteMinutes: q.commutePriority === "high" ? 35 : q.commutePriority === "medium" ? 50 : undefined,
    keywords: [
      ...(q.stylePreferences ?? []),
      ...(q.lifestyleTags ?? []),
      ...(q.specialSpaces ?? []),
    ],
    amenities: (q.pets ? ["pet-friendly"] : []) as string[],
  };
  const summary = `Dream profile: ${family} people · ${q.transactionType ?? "buy/rent (set transaction type)"}${city ? ` · ${String(city)}` : ""}`.trim();
  return {
    summary,
    householdProfile,
    lifestyleTags: uniqueLifestyle,
    propertyTraits: propertyTraits.slice(0, 24),
    neighborhoodTraits: neighborhoodTraits.slice(0, 12),
    searchFilters,
    rankingPreferences: ranking,
    rationale: [
      "Generated with rule-based logic from your form answers (no background inference, no LLM in v1).",
      "Filters and scores use only what you entered; refine any step to sharpen results.",
    ],
    tradeoffs: tradeoffs.length ? tradeoffs : ["Weigh budget vs space vs commute as you review listings."],
    warnings: warn,
  };
}

function hasQuestionnaireKeys(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return false;
  }
  const o = raw as Record<string, unknown>;
  return (
    o.familySize != null ||
    o.adultsCount != null ||
    o.guestsFrequency != null ||
    o.transactionType != null ||
    o.budgetMin != null ||
    o.budgetMax != null ||
    o.privacyPreference === "low" ||
    o.privacyPreference === "medium" ||
    o.privacyPreference === "high"
  );
}

function mergeQuestionnaire(legacy: DreamHomeQuestionnaireInput, q: DreamHomeQuestionnaireInput): DreamHomeQuestionnaireInput {
  return { ...legacy, ...q };
}

function coalesceQuestionnaire(intakeRaw: unknown): { q: DreamHomeQuestionnaireInput; legacy?: DreamHomeIntake } {
  try {
    const hasQ = hasQuestionnaireKeys(intakeRaw);
    const hasLegacy = Boolean(
      intakeRaw &&
        typeof intakeRaw === "object" &&
        !Array.isArray(intakeRaw) &&
        (intakeRaw as Record<string, unknown>).householdSize != null,
    );
    if (hasQ) {
      const nq = normalizeQuestionnaire(intakeRaw);
      if (hasLegacy) {
        return { q: mergeQuestionnaire(legacyIntakeToQuestionnaire(normalizeIntake(intakeRaw)), nq) };
      }
      return { q: nq };
    }
    if (hasLegacy) {
      const li = normalizeIntake(intakeRaw);
      return { q: legacyIntakeToQuestionnaire(li), legacy: li };
    }
    const empty = normalizeQuestionnaire(intakeRaw);
    if (Object.keys(empty).length) {
      return { q: empty };
    }
    return { q: {} };
  } catch {
    return { q: {} };
  }
}

/**
 * Coalesce raw body, build deterministic profile, log memory (non-blocking). Never throws.
 */
export async function buildDreamHomeProfile(
  intakeRaw: unknown,
): Promise<{ profile: DreamHomeProfile; source: "deterministic" }> {
  let co: ReturnType<typeof coalesceQuestionnaire> = { q: {} };
  try {
    co = coalesceQuestionnaire(intakeRaw);
  } catch {
    co = { q: {} };
  }
  const { q, legacy } = co;
  let profile: DreamHomeProfile;
  try {
    profile = generateProfile(q, legacy);
  } catch {
    profile = generateProfile({}, undefined);
  }
  void logDreamHomeProfileGenerated({ questionnaire: { ...q }, source: "deterministic" }).catch(() => {});
  return { profile, source: "deterministic" };
}