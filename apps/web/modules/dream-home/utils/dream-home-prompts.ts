import type { DreamHomeProfile } from "../types/dream-home.types";

const SAFETY = `Never infer preferences from nationality, ethnicity, religion, or any protected characteristics.
Do not stereotype. Use only the JSON fields the user provided.
If a field is missing, omit or use neutral language — do not guess cultural defaults.
Output practical housing guidance only.`;

const STRUCTURE = `Return a single JSON object (no markdown fences) with this shape:
{
  "summary"?: string,
  "householdProfile": string,
  "propertyTraits": string[],
  "neighborhoodTraits": string[],
  "searchFilters": {
    "propertyType"?: string[],
    "minBedrooms"?: number,
    "minBathrooms"?: number,
    "bedroomsMin"?: number,
    "bathroomsMin"?: number,
    "budgetMin"?: number,
    "budgetMax"?: number,
    "maxBudget"?: number,
    "amenities"?: string[],
    "keywords"?: string[],
    "city"?: string,
    "neighborhoods"?: string[],
    "maxCommuteMinutes"?: number
  },
  "rationale": string[],
  "tradeoffs"?: string[],
  "warnings"?: string[]
}
Use the same units as the form (e.g. budget in major currency, not cents).`;

export function buildDreamHomeProfileSystemPrompt(): string {
  return `You are "Dream Home" for a real-estate platform. You receive JSON with USER-DECLARED housing and lifestyle fields only.
${SAFETY}
${STRUCTURE}
Be concise, structured, and non-judgmental.`;
}

export function buildDreamHomeUserPrompt(intakeJson: string): string {
  return `User-declared JSON (only these fields are authoritative for personalization):\n${intakeJson}\n\nTransform into the required output shape. Tie every statement to a provided field.`;
}

export function validateDreamHomeProfileShape(raw: Record<string, unknown>): DreamHomeProfile | null {
  const householdProfile = typeof raw.householdProfile === "string" ? raw.householdProfile.trim() : "";
  if (!householdProfile) {
    return null;
  }
  const asStringArr = (v: unknown) =>
    Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];
  return {
    summary: typeof raw.summary === "string" ? raw.summary.trim() : undefined,
    householdProfile,
    propertyTraits: asStringArr(raw.propertyTraits).slice(0, 24),
    neighborhoodTraits:
      asStringArr(raw.neighborhoodTraits).length > 0
        ? asStringArr(raw.neighborhoodTraits).slice(0, 16)
        : ["Neighborhood fit from your city and priority settings"],
    searchFilters: pickSearchFilters(raw.searchFilters),
    rankingPreferences: undefined,
    rationale: asStringArr(raw.rationale).slice(0, 20),
    tradeoffs: asStringArr(raw.tradeoffs).slice(0, 10),
    warnings: asStringArr(raw.warnings).slice(0, 8),
  };
}

function pickSearchFilters(s: unknown): DreamHomeProfile["searchFilters"] {
  if (!s || typeof s !== "object" || Array.isArray(s)) {
    return {};
  }
  const o = s as Record<string, unknown>;
  const n = (k: string) => {
    const v = o[k];
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  };
  const asStrArr = (k: string) => {
    const v = o[k];
    if (!Array.isArray(v)) {
      return undefined;
    }
    return v.filter((x): x is string => typeof x === "string" && x.trim().length);
  };
  return {
    propertyType: asStrArr("propertyType") ?? asStrArr("propertyTypes"),
    minBedrooms: n("minBedrooms") ?? n("bedroomsMin"),
    minBathrooms: n("minBathrooms") ?? n("bathroomsMin"),
    bedroomsMin: n("bedroomsMin") ?? n("minBedrooms"),
    bathroomsMin: n("bathroomsMin") ?? n("minBathrooms"),
    budgetMin: n("budgetMin"),
    budgetMax: n("budgetMax") ?? n("maxBudget"),
    maxBudget: n("maxBudget") ?? n("budgetMax"),
    amenities: asStrArr("amenities"),
    keywords: asStrArr("keywords"),
    city: typeof o.city === "string" ? o.city : undefined,
    neighborhoods: asStrArr("neighborhoods"),
    maxCommuteMinutes: n("maxCommuteMinutes"),
  };
}
