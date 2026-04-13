/**
 * BNHUB listing copy — title, description, amenities from structured host inputs only.
 * Does not invent exact addresses, unit numbers, or legal claims.
 */

import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type BnhubAiListingDraftInput = {
  address: string;
  city: string;
  region?: string | null;
  country?: string | null;
  /** Nightly price in minor units (cents) */
  nightPriceCents: number;
  propertyType: string;
  roomType: string;
  beds: number;
  baths: number;
  maxGuests: number;
  /** Optional free text — pet-friendly, parking, view, etc. */
  notes?: string | null;
};

export type BnhubAiListingDraftResult = {
  title: string;
  description: string;
  /** Normalized amenity labels */
  amenities: string[];
  source: "openai" | "deterministic";
};

function moneyCad(cents: number): string {
  const n = cents / 100;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fallbackDraft(input: BnhubAiListingDraftInput): BnhubAiListingDraftResult {
  const city = input.city.trim() || "your city";
  const pt = input.propertyType.trim() || "stay";
  const room = input.roomType.trim() || "Entire place";
  const price = moneyCad(Math.max(input.nightPriceCents, 100));
  const notesLine = input.notes?.trim()
    ? `\n\nHost notes we used as hints only (you can edit everything): ${input.notes.trim()}`
    : "";

  const title = `${room === "Entire place" ? "Entire" : room} ${pt.toLowerCase()} · ${city}`;

  const description = [
    `Welcome to this ${room.toLowerCase()} ${pt.toLowerCase()} in ${city}.`,
    `Nightly rate from ${price} (confirm before publishing).`,
    `Sleeps up to ${input.maxGuests} guest(s) · ${input.beds} bed(s) · ${input.baths} bath(s).`,
    `The address you entered is used for positioning only — please double-check every detail before publishing.${notesLine}`,
    ``,
    `BNHUB reminder: describe only what you know to be true; guests rely on accurate photos and house rules.`,
  ].join("\n");

  const amenities = [
    "Wi‑Fi",
    "Kitchen",
    "Heating",
    "Smoke alarm",
    input.maxGuests > 2 ? "Dedicated workspace" : "Essentials",
  ];

  return { title: title.slice(0, 120), description: description.slice(0, 8000), amenities, source: "deterministic" };
}

export async function generateBnhubListingDraftContent(
  input: BnhubAiListingDraftInput
): Promise<BnhubAiListingDraftResult> {
  const base = fallbackDraft(input);
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    return base;
  }

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You help BNHUB hosts write listing copy for short-term stays in Canada (often Québec).

Hard rules:
- Use ONLY facts from the JSON input. Do not invent suite numbers, views, parking guarantees, or distances.
- Do not claim "verified", "licensed", or legal compliance unless in input.
- Title: max 90 characters, appealing but honest.
- Description: 3–6 short paragraphs, plain English or French per city context; mention guests should verify address and rules before publishing.
- Amenities: 8–14 items as short labels (e.g. "Wi‑Fi", "Kitchen", "Free parking on premises" only if notes imply parking).
- Output JSON only: {"title": string, "description": string, "amenities": string[]}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            address: input.address.slice(0, 300),
            city: input.city,
            region: input.region ?? "",
            country: input.country ?? "CA",
            nightPriceCad: moneyCad(input.nightPriceCents),
            propertyType: input.propertyType,
            roomType: input.roomType,
            beds: input.beds,
            baths: input.baths,
            maxGuests: input.maxGuests,
            notes: input.notes?.slice(0, 500) ?? "",
          }),
        },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim();
    if (!text) return base;

    const parsed = JSON.parse(text) as { title?: unknown; description?: unknown; amenities?: unknown };
    const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 120) : "";
    const description = typeof parsed.description === "string" ? parsed.description.trim().slice(0, 8000) : "";
    const amenitiesRaw = Array.isArray(parsed.amenities) ? parsed.amenities : [];
    const amenities = amenitiesRaw
      .filter((a): a is string => typeof a === "string" && a.trim().length > 0)
      .map((a) => a.trim())
      .slice(0, 20);

    if (!title || !description || amenities.length < 4) {
      return base;
    }

    return { title, description, amenities, source: "openai" };
  } catch {
    return base;
  }
}
