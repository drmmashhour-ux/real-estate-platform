import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { logDreamHomeProfileGenerated } from "./dream-home-playbook-memory.service";
import type { DreamHomeIntake, DreamHomeProfile, DreamHomeQuestionnaireInput } from "../types/dream-home.types";
import {
  buildDefaultRankingPreferences,
  suggestBedroomBathMinimums,
} from "../utils/dream-home-scoring";
import { buildDreamHomeTradeoffs } from "../utils/dream-home-tradeoffs";
import { buildDreamHomeUserPrompt, buildDreamHomeProfileSystemPrompt, validateDreamHomeProfileShape } from "../utils/dream-home-prompts";
import {
  legacyIntakeToQuestionnaire,
  normalizeIntake,
  normalizeQuestionnaire,
} from "../utils/dream-home-normalize";

const MODEL = process.env.DREAM_HOME_AI_MODEL?.trim() || "gpt-4o-mini";

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

function buildDeterministicProfile(q: DreamHomeQuestionnaireInput, intakeFallback?: DreamHomeIntake): DreamHomeProfile {
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
    propertyTraits.push("Layout suited to guests: generous kitchen/gathering flow (from your hosting settings)");
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
  if (q.kitchenPriority === "high") {
    propertyTraits.push("Kitchen-forward layout (from your kitchen priority)");
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
    propertyTraits: propertyTraits.slice(0, 24),
    neighborhoodTraits: neighborhoodTraits.slice(0, 12),
    searchFilters,
    rankingPreferences: ranking,
    rationale: [
      "Generated deterministically from your form answers (no background inference).",
      isOpenAiConfigured() ? "Enable richer narrative with your existing AI configuration — deterministic path used if the model is unavailable or returns invalid JSON." : "Set OPENAI_API_KEY for an optional AI-written narrative; filters stay rule-based either way.",
    ],
    tradeoffs: tradeoffs.length ? tradeoffs : ["Weigh budget vs space vs commute as you review listings."],
    warnings: warn,
  };
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function tryParseProfile(text: string): DreamHomeProfile | null {
  try {
    const cleaned = stripJsonFences(text);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return validateDreamHomeProfileShape(parsed);
  } catch {
    return null;
  }
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
 * Structured dream-home profile. Never throws: falls back to deterministic on any error.
 */
export async function buildDreamHomeProfile(
  intakeRaw: unknown,
): Promise<{ profile: DreamHomeProfile; source: "ai" | "deterministic" }> {
  let co: ReturnType<typeof coalesceQuestionnaire> = { q: {} };
  try {
    co = coalesceQuestionnaire(intakeRaw);
  } catch {
    co = { q: {} };
  }
  const { q, legacy } = co;
  const det = buildDeterministicProfile(q, legacy);

  const client = openai;
  if (isOpenAiConfigured() && client) {
    try {
      const payload = JSON.stringify({ ...q, legacy: legacy ?? null });
      const system = buildDreamHomeProfileSystemPrompt();
      const user = buildDreamHomeUserPrompt(payload);
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.35,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      const parsed = raw ? tryParseProfile(raw) : null;
      if (parsed) {
        const merged: DreamHomeProfile = {
          ...det,
          ...parsed,
          propertyTraits: parsed.propertyTraits.length ? parsed.propertyTraits : det.propertyTraits,
          neighborhoodTraits: parsed.neighborhoodTraits.length ? parsed.neighborhoodTraits : det.neighborhoodTraits,
          searchFilters: { ...det.searchFilters, ...parsed.searchFilters },
          rankingPreferences: det.rankingPreferences,
          tradeoffs: parsed.tradeoffs?.length ? parsed.tradeoffs : det.tradeoffs,
          warnings: [...(det.warnings ?? []), ...(parsed.warnings ?? [])].filter(Boolean).slice(0, 8),
        };
        void logDreamHomeProfileGenerated({ questionnaire: { ...q }, source: "ai" }).catch(() => {});
        return { profile: merged, source: "ai" };
      }
    } catch {
      /* fall back */
    }
  }

  void logDreamHomeProfileGenerated({ questionnaire: { ...q }, source: "deterministic" }).catch(() => {});
  return { profile: det, source: "deterministic" };
}
