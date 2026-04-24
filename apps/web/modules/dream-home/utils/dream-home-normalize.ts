import type { DreamHomeIntake, DreamHomeQuestionnaireInput } from "../types/dream-home.types";

/** Keys we never pass to the model or use for matching (safety / anti-profiling). */
const STRIP_INTAKE_KEYS = new Set([
  "nationality",
  "nationalities",
  "countryOfBirth",
  "countryOfOrigin",
  "ethnicity",
  "ethnicityInferred",
  "religionInferred",
  "religion",
  "race",
  "protectedTraitsInferred",
]);

const MAX_LEN = 4000;

function truncate(s: string): string {
  if (s.length <= MAX_LEN) return s;
  return `${s.slice(0, MAX_LEN)}…`;
}

/**
 * Strips unsafe keys, caps string length, and ensures numeric fields are finite.
 * Does not add inferred preferences — only cleans transport.
 */
export function normalizeIntake(input: unknown): DreamHomeIntake {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const raw = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (STRIP_INTAKE_KEYS.has(k)) continue;
    if (k === "culturalLifestyleTags" && Array.isArray(v)) {
      out[k] = v.filter((x): x is string => typeof x === "string").map((s) => truncate(s));
      continue;
    }
    if (typeof v === "string") {
      out[k] = truncate(v);
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v;
    } else if (v === null || v === undefined) {
      continue;
    }
  }
  return out as DreamHomeIntake;
}

function toFiniteInt(v: unknown, min: number, max: number): number | undefined {
  if (v === null || v === undefined) {
    return undefined;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) {
    return undefined;
  }
  return Math.max(min, Math.min(max, Math.floor(n)));
}

const LEVEL3 = new Set(["low", "medium", "high"] as const);

function asLevel3(v: unknown): "low" | "medium" | "high" | undefined {
  if (typeof v === "string" && LEVEL3.has(v as "low")) {
    return v as "low" | "medium" | "high";
  }
  return undefined;
}

/**
 * Strips unknown keys, normalizes enums and arrays, caps lengths. No inference of new preferences.
 */
export function normalizeQuestionnaire(input: unknown): DreamHomeQuestionnaireInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const raw = input as Record<string, unknown>;
  const out: DreamHomeQuestionnaireInput = {};
  if (raw.familySize != null) {
    out.familySize = toFiniteInt(raw.familySize, 1, 20);
  }
  if (raw.adultsCount != null) {
    out.adultsCount = toFiniteInt(raw.adultsCount, 1, 20);
  }
  if (raw.childrenCount != null) {
    out.childrenCount = toFiniteInt(raw.childrenCount, 0, 20);
  }
  if (raw.eldersInHome === true) {
    out.eldersInHome = true;
  }
  if (asLevel3(raw.guestsFrequency)) {
    out.guestsFrequency = asLevel3(raw.guestsFrequency);
  }
  if (raw.workFromHome != null) {
    const w = String(raw.workFromHome);
    if (w === "none" || w === "sometimes" || w === "full_time") {
      out.workFromHome = w;
    }
  }
  if (raw.budgetMin != null && raw.budgetMin !== "") {
    const n = Number(raw.budgetMin);
    if (Number.isFinite(n) && n >= 0) {
      out.budgetMin = n;
    }
  }
  if (raw.budgetMax != null && raw.budgetMax !== "") {
    const n = Number(raw.budgetMax);
    if (Number.isFinite(n) && n >= 0) {
      out.budgetMax = n;
    }
  }
  if (raw.transactionType != null) {
    const t = String(raw.transactionType);
    if (t === "buy" || t === "rent" || t === "bnb_stay") {
      out.transactionType = t;
    }
  }
  if (typeof raw.city === "string" && raw.city.trim()) {
    out.city = raw.city.trim().slice(0, 200);
  }
  if (Array.isArray(raw.neighborhoods)) {
    out.neighborhoods = (raw.neighborhoods as unknown[])
      .filter((x): x is string => typeof x === "string" && x.trim().length)
      .map((s) => s.trim())
      .slice(0, 40);
  }
  if (raw.radiusKm != null) {
    const n = Number(raw.radiusKm);
    if (Number.isFinite(n) && n >= 0) {
      out.radiusKm = n;
    }
  }
  for (const k of [
    "commutePriority",
    "privacyPreference",
    "hostingPreference",
    "kitchenPriority",
    "outdoorPriority",
    "noiseTolerance",
  ] as const) {
    if (asLevel3(raw[k])) {
      (out as Record<string, unknown>)[k] = asLevel3(raw[k]);
    }
  }
  if (Array.isArray(raw.accessibilityNeeds)) {
    out.accessibilityNeeds = (raw.accessibilityNeeds as unknown[])
      .filter((x): x is string => typeof x === "string" && x.trim().length)
      .map((s) => truncate(s.trim()))
      .slice(0, 20);
  }
  if (raw.pets === true) {
    out.pets = true;
  }
  for (const arr of ["stylePreferences", "specialSpaces", "lifestyleTags", "mustHaves", "dealBreakers"] as const) {
    if (Array.isArray(raw[arr])) {
      (out as Record<string, unknown>)[arr] = (raw[arr] as unknown[])
        .filter((x): x is string => typeof x === "string" && x.trim().length)
        .map((s) => truncate(s.trim()))
        .slice(0, 40);
    }
  }
  return out;
}

export type FamilySizeBand = "small" | "medium" | "large" | "unknown";
export type BudgetBand = "unknown" | "low" | "mid" | "high" | "luxury";

export function toFamilySizeBand(familySize?: number | null): FamilySizeBand {
  if (familySize == null || !Number.isFinite(familySize)) {
    return "unknown";
  }
  if (familySize <= 2) {
    return "small";
  }
  if (familySize <= 4) {
    return "medium";
  }
  return "large";
}

/**
 * Map legacy wizard intake to questionnaire fields (explicit user data only, no new inference of protected traits).
 */
export function legacyIntakeToQuestionnaire(intake: DreamHomeIntake): DreamHomeQuestionnaireInput {
  const mapPrivacy = (p?: string): "low" | "medium" | "high" | undefined => {
    if (p === "high") {
      return "high";
    }
    if (p === "open" || p === "low") {
      return "low";
    }
    if (p === "balanced" || p === "medium") {
      return "medium";
    }
    return undefined;
  };
  const mapNoise = (n?: string): "low" | "medium" | "high" | undefined => {
    if (n === "quiet") {
      return "high";
    }
    if (n === "lively") {
      return "low";
    }
    if (n === "moderate") {
      return "medium";
    }
    if (n === "low" || n === "medium" || n === "high") {
      return n;
    }
    return undefined;
  };
  const g = intake.guestFrequency;
  const guestsFrequency: "low" | "medium" | "high" =
    g == null || !Number.isFinite(g) ? "low" : g > 0.55 ? "high" : g > 0.25 ? "medium" : "low";
  return {
    familySize: intake.householdSize,
    guestsFrequency,
    workFromHome: intake.workFromHome
      ? intake.wfhImportance != null && intake.wfhImportance > 0.6
        ? "full_time"
        : "sometimes"
      : "none",
    budgetMax: intake.maxBudget,
    city: intake.city ?? null,
    privacyPreference: mapPrivacy(intake.privacyPreference),
    hostingPreference:
      intake.entertainingStyle === "social" ? "high" : intake.entertainingStyle === "quiet" ? "low" : "medium",
    kitchenPriority: intake.cookingHabits && intake.cookingHabits.trim() ? "high" : "medium",
    outdoorPriority:
      intake.indoorOutdoorPriority === "outdoor" ? "high" : intake.indoorOutdoorPriority === "indoor" ? "low" : "medium",
    noiseTolerance: mapNoise(intake.noiseTolerance),
    pets: intake.hasPets === true,
    accessibilityNeeds: intake.accessibilityNeeds && intake.accessibilityNeeds.trim() ? [truncate(intake.accessibilityNeeds)] : undefined,
    stylePreferences: [intake.designTaste, intake.lifestyleNote].filter(
      (s): s is string => typeof s === "string" && !!s.trim(),
    ),
    specialSpaces: intake.culturalLifestyleTags,
    lifestyleTags: intake.culturalLifestyleTags,
    mustHaves: undefined,
  };
}

export function toBudgetBand(min?: number | null, max?: number | null): BudgetBand {
  const cap = max != null && Number.isFinite(max) && max > 0 ? max : min != null && Number.isFinite(min) && min > 0 ? min : null;
  if (cap == null) {
    return "unknown";
  }
  if (cap < 200_000) {
    return "low";
  }
  if (cap < 800_000) {
    return "mid";
  }
  if (cap < 2_000_000) {
    return "high";
  }
  return "luxury";
}
