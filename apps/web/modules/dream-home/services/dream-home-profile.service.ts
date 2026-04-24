import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import type { DreamHomeIntake, DreamHomeProfile } from "../types/dream-home.types";
import { normalizeIntake } from "../utils/dream-home-normalize";

const MODEL = process.env.DREAM_HOME_AI_MODEL?.trim() || "gpt-4o-mini";

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function clampSearchFilters(raw: unknown): DreamHomeProfile["searchFilters"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const bed = o.bedroomsMin;
  const bath = o.bathroomsMin;
  const maxB = o.maxBudget;
  const city = o.city;
  return {
    propertyType: asStringArray(o.propertyType),
    bedroomsMin: typeof bed === "number" && Number.isFinite(bed) ? Math.max(0, Math.floor(bed)) : undefined,
    bathroomsMin: typeof bath === "number" && Number.isFinite(bath) ? Math.max(0, bath) : undefined,
    maxBudget: typeof maxB === "number" && Number.isFinite(maxB) && maxB > 0 ? maxB : undefined,
    amenities: asStringArray(o.amenities),
    keywords: asStringArray(o.keywords),
    city: typeof city === "string" && city.trim() ? city.trim() : undefined,
  };
}

function parseProfileJson(text: string): DreamHomeProfile | null {
  try {
    const cleaned = stripJsonFences(text);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const householdProfile = typeof parsed.householdProfile === "string" ? parsed.householdProfile.trim() : "";
    if (!householdProfile) return null;
    return {
      householdProfile,
      propertyTraits: asStringArray(parsed.propertyTraits).slice(0, 24),
      neighborhoodTraits:
        asStringArray(parsed.neighborhoodTraits).length > 0
          ? asStringArray(parsed.neighborhoodTraits).slice(0, 16)
          : ["Neighborhood fit based on your city and lifestyle notes"],
      searchFilters: clampSearchFilters(parsed.searchFilters),
      rationale: asStringArray(parsed.rationale).slice(0, 16),
    };
  } catch {
    return null;
  }
}

function deterministicProfile(intake: DreamHomeIntake): DreamHomeProfile {
  const beds = Math.min(8, Math.max(1, Math.ceil((intake.householdSize ?? 2) * 0.45) + (intake.guestFrequency && intake.guestFrequency > 0.4 ? 1 : 0)));
  const baths = Math.min(6, Math.max(1, Math.floor(beds / 2) + 1));
  const traits: string[] = [];
  if (intake.workFromHome) traits.push("Dedicated or separable workspace");
  if (intake.entertainingStyle === "social" || intake.entertainingStyle === "moderate") {
    traits.push("Strong kitchen and open gathering space");
  }
  if (intake.privacyPreference === "high") traits.push("Layout with separated quiet zones");
  if (intake.hasPets) traits.push("Pet-friendly features or yard access");
  if (intake.accessibilityNeeds) traits.push("Accessibility-friendly layout (per your notes)");
  if (intake.culturalLifestyleTags?.length) {
    traits.push(`Accommodations aligned to your selected preferences: ${intake.culturalLifestyleTags.slice(0, 4).join(", ")}`);
  }
  if (traits.length === 0) traits.push("Flexible layout that can adapt as your needs evolve");

  return {
    householdProfile: `A ${intake.householdSize ?? "small"}-person household seeking comfort, ${intake.noiseTolerance ?? "balanced"} surroundings, and ${intake.privacyPreference ?? "balanced"} privacy.`,
    propertyTraits: traits,
    neighborhoodTraits: [
      intake.city ? `Preference around ${intake.city}` : "Neighborhood fit based on your commute and lifestyle notes",
      intake.noiseTolerance === "quiet" ? "Quieter residential feel" : "Balanced urban or suburban amenities",
    ],
    searchFilters: {
      bedroomsMin: beds,
      bathroomsMin: baths,
      maxBudget: intake.maxBudget,
      city: intake.city,
      keywords: [intake.designTaste, intake.lifestyleNote].filter(Boolean) as string[],
    },
    rationale: [
      "Generated without OpenAI — set OPENAI_API_KEY for richer narratives.",
      "Based only on fields you provided in the form (no nationality or origin inference).",
    ],
  };
}

const SYSTEM = `You are "AI Dream Home Match" for a Canadian real-estate platform.
You receive JSON describing USER-DECLARED housing preferences only.

HARD RULES:
- Never infer preferences from nationality, ethnicity, religion, or place of origin.
- Never mention or guess the user's nationality or background.
- Never claim you know "traditional" norms for any group — only reflect what the user explicitly wrote or selected.
- If cultural or multigenerational needs appear, they MUST come from user fields like culturalLifestyleTags or freeform text.
- Output valid JSON only, with this exact structure:
{
  "householdProfile": string,
  "propertyTraits": string[],
  "neighborhoodTraits": string[],
  "searchFilters": {
    "propertyType": string[] (optional),
    "bedroomsMin": number (optional),
    "bathroomsMin": number (optional),
    "maxBudget": number (optional, same currency as listing price),
    "amenities": string[] (optional),
    "keywords": string[] (optional),
    "city": string (optional)
  },
  "rationale": string[] (short bullet reasons tied to user inputs)
}
Use Canadian real-estate vocabulary where relevant. Be practical and non-stereotyping.`;

/**
 * Builds a structured dream-home profile from normalized intake (OpenAI when configured, else deterministic).
 */
export async function buildDreamHomeProfile(
  intakeRaw: unknown,
): Promise<{ profile: DreamHomeProfile; source: "ai" | "deterministic" }> {
  const intake = normalizeIntake(intakeRaw);

  const client = openai;
  if (isOpenAiConfigured() && client) {
    try {
      const userPayload = JSON.stringify(intake);
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.35,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `User-declared intake (JSON). Interpret into the required output shape.\n${userPayload}`,
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      const parsed = raw ? parseProfileJson(raw) : null;
      if (parsed) {
        return { profile: parsed, source: "ai" };
      }
    } catch {
      // fall through to deterministic
    }
  }

  return { profile: deterministicProfile(intake), source: "deterministic" };
}
