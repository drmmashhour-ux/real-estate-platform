import OpenAI from "openai";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { logError } from "@/lib/logger";
import { buildSystemPrompt, buildUserPayload } from "./content-prompts";
import {
  type ContentPackItem,
  type ListingContentInput,
  structuredContentResponseSchema,
} from "./types";
import type { LearningAugmentation } from "@/lib/content-intelligence/learning-context";

function priceValid(input: ListingContentInput): boolean {
  return Number.isFinite(input.nightPriceCents) && input.nightPriceCents >= 100;
}

const JSON_SCHEMA = {
  name: "lecipm_content_packs",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["contentPacks"],
    properties: {
      contentPacks: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "style",
            "valid",
            "invalidReason",
            "hook",
            "script",
            "caption",
            "hashtags",
            "overlayText",
            "cta",
            "safetyChecks",
            "requiredFieldsUsed",
          ],
          properties: {
            style: {
              type: "string",
              enum: ["price_shock", "lifestyle", "comparison", "question", "hidden_gem"],
            },
            valid: { type: "boolean" },
            invalidReason: { type: "string" },
            hook: { type: "string" },
            script: { type: "string" },
            caption: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            overlayText: { type: "array", items: { type: "string" } },
            cta: { type: "string" },
            safetyChecks: { type: "array", items: { type: "string" } },
            requiredFieldsUsed: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
} as const;

function extractOutputText(res: { output_text?: string | null }): string {
  const t = res.output_text;
  return typeof t === "string" ? t : "";
}

function checksFor(input: ListingContentInput, style: string): string[] {
  return [
    `city=${input.city ? "ok" : "missing"}`,
    `price=${priceValid(input) ? "ok" : "missing_or_low"}`,
    `amenities=${input.amenities.length ? "ok" : "empty"}`,
    `style=${style}`,
  ];
}

function fieldsUsed(input: ListingContentInput): string[] {
  const u = ["title", "city", "propertyType", "amenities"];
  if (priceValid(input)) u.push("nightPriceCents");
  if (input.neighborhood?.trim()) u.push("neighborhood");
  if (input.descriptionExcerpt?.trim()) u.push("description");
  return u;
}

export function deterministicPacks(input: ListingContentInput): ContentPackItem[] {
  const city = input.city.trim() || "";
  const pv = priceValid(input);
  const price = (input.nightPriceCents / 100).toFixed(0);
  const pt = input.propertyType?.trim() || "stay";
  const amenStr = input.amenities.slice(0, 6).join(", ") || "see listing";
  const nh = input.neighborhood?.trim();

  const priceShock: ContentPackItem = pv
    ? {
        style: "price_shock",
        valid: true,
        invalidReason: "",
        hook: `Under $${price}/night in ${city}?`,
        script: `Quick look at this ${pt} in ${city}. Nightly rate from the listing: about $${price}. Amenities: ${amenStr}.`,
        caption: `${input.title} · from $${price}/night · ${city}.`,
        hashtags: ["#travel", "#vacationrental", city.replace(/\s+/g, "")].filter(Boolean).slice(0, 8),
        overlayText: [`From $${price}/night`, city],
        cta: "View listing & book",
        safetyChecks: checksFor(input, "price_shock"),
        requiredFieldsUsed: fieldsUsed(input),
      }
    : {
        style: "price_shock",
        valid: false,
        invalidReason: "Nightly price missing or below minimum — price_shock pack disabled.",
        hook: "",
        script: "",
        caption: "",
        hashtags: [],
        overlayText: [],
        cta: "",
        safetyChecks: checksFor(input, "price_shock"),
        requiredFieldsUsed: fieldsUsed(input),
      };

  const priceLine = pv ? `about $${price} per night on the listing` : "pricing on the listing page";
  const priceOverlay = pv ? `$${price}/night` : "See listing";

  const lifestyle: ContentPackItem = {
    style: "lifestyle",
    valid: Boolean(city),
    invalidReason: city ? "" : "City missing for local lifestyle copy.",
    hook: city ? `Stay like a local in ${city}` : "Stay details on the listing",
    script: city
      ? `This ${pt}${nh ? ` near ${nh}` : ""} in ${city}. Amenities from your listing: ${amenStr}.`
      : "Open the listing for verified location and amenities.",
    caption: `${input.title} on BNHUB.`,
    hashtags: ["#staycation", "#bnb"],
    overlayText: city ? ["Your base in " + city, pt] : [pt, "BNHUB"],
    cta: "See photos & amenities",
    safetyChecks: checksFor(input, "lifestyle"),
    requiredFieldsUsed: fieldsUsed(input),
  };

  const comparison: ContentPackItem = {
    style: "comparison",
    valid: Boolean(city),
    invalidReason: city ? "" : "City missing.",
    hook: `More space than a typical hotel room?`,
    script: city
      ? `Compare this ${pt} in ${city} (${priceLine}) vs a standard hotel room. Amenities: ${amenStr}.`
      : "Compare space and amenities on the listing.",
    caption: `${input.title} — ${city || "BNHUB listing"}.`,
    hashtags: ["#traveltips", "#shorttermrental"],
    overlayText: ["Room to breathe", priceOverlay],
    cta: "Open listing",
    safetyChecks: checksFor(input, "comparison"),
    requiredFieldsUsed: fieldsUsed(input),
  };

  const question: ContentPackItem = {
    style: "question",
    valid: Boolean(city),
    invalidReason: city ? "" : "City missing.",
    hook: city ? `Planning a trip to ${city}?` : "Planning a stay?",
    script: city
      ? `Would this ${pt} work for your group? ${pv ? `Nightly from about $${price}.` : "Pricing on the listing."} Amenities: ${amenStr}.`
      : "See the listing for capacity, amenities, and pricing.",
    caption: `${input.title} — details on BNHUB.`,
    hashtags: ["#travel"],
    overlayText: [city || "BNHUB", priceOverlay],
    cta: "Check availability",
    safetyChecks: checksFor(input, "question"),
    requiredFieldsUsed: fieldsUsed(input),
  };

  const hidden_gem: ContentPackItem = {
    style: "hidden_gem",
    valid: Boolean(city),
    invalidReason: city ? "" : "City missing.",
    hook: city ? `${city} — worth a second look` : "Worth a look",
    script: city
      ? `A ${pt} stay in ${city}${nh ? ` (${nh})` : ""}. ${pv ? `From roughly $${price} a night on the listing.` : "Pricing on the listing."} Amenities: ${amenStr}.`
      : "See listing for verified details.",
    caption: `${input.title} · ${city || "BNHUB"}`,
    hashtags: ["#hiddengem", "#vacation"],
    overlayText: [city || "Stay", "BNHUB"],
    cta: "Explore listing",
    safetyChecks: checksFor(input, "hidden_gem"),
    requiredFieldsUsed: fieldsUsed(input),
  };

  return [priceShock, lifestyle, comparison, question, hidden_gem];
}

/**
 * OpenAI Responses API + structured JSON; falls back to deterministic packs when AI is off or fails.
 * Optional `learning` biases copy toward measured winners while preserving exploration (see learning-context).
 */
export async function generateContentPacksStructured(
  input: ListingContentInput,
  opts?: { learning?: LearningAugmentation | null }
): Promise<{
  packs: ContentPackItem[];
  source: "openai" | "deterministic";
}> {
  const fallback = () => ({ packs: deterministicPacks(input), source: "deterministic" as const });

  const client: OpenAI | null = openai;
  if (!isOpenAiConfigured() || !client) {
    return fallback();
  }

  const model = process.env.CONTENT_AUTOMATION_OPENAI_MODEL?.trim() || "gpt-4o-mini";

  let systemContent = buildSystemPrompt();
  let userContent =
    buildUserPayload(input) +
    "\n\nReturn exactly five contentPacks in order: price_shock, lifestyle, comparison, question, hidden_gem. " +
    "Set valid=false for price_shock if nightly price is missing or under $1. " +
    "Never invent amenities, prices, or addresses. Fill safetyChecks and requiredFieldsUsed.";
  if (opts?.learning?.systemExtra) {
    systemContent += `\n\n${opts.learning.systemExtra}`;
  }
  if (opts?.learning?.userExtra) {
    userContent += `\n\n${opts.learning.userExtra}`;
  }

  try {
    const res = await client.responses.create({
      model,
      input: [
        { role: "system", content: systemContent },
        {
          role: "user",
          content: userContent,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: JSON_SCHEMA.name,
          strict: JSON_SCHEMA.strict,
          schema: JSON_SCHEMA.schema,
        },
      },
    });

    const raw = extractOutputText(res).trim();
    if (!raw) return fallback();

    const parsed = JSON.parse(raw) as unknown;
    const validated = structuredContentResponseSchema.safeParse(parsed);
    if (!validated.success) {
      logError("Content pack JSON failed validation", validated.error);
      return fallback();
    }

    const det = deterministicPacks(input);
    const byStyle = new Map(det.map((p) => [p.style, p] as const));
    for (const p of validated.data.contentPacks) {
      byStyle.set(p.style, p);
    }
    const required = ["price_shock", "lifestyle", "comparison", "question", "hidden_gem"] as const;
    const packs = required.map((s) => {
      const p = byStyle.get(s)!;
      return {
        ...p,
        invalidReason: p.invalidReason ?? "",
      } as ContentPackItem;
    });

    return { packs, source: "openai" };
  } catch (e) {
    logError("generateContentPacksStructured OpenAI error", e);
    return fallback();
  }
}
