import type { ListingContentInput } from "./types";

const SAFETY_RULES = [
  "Use ONLY the facts provided (title, city, price, property type, amenities list, image count, description excerpt).",
  "Do NOT invent unit numbers, views, awards, legal claims, or amenities not in the list.",
  "Do NOT claim discounts, promotions, or availability unless explicitly in the input.",
  "Hooks and scripts must be honest; prefer curiosity and clarity over hype.",
  "Hashtags: mix branded (#BNHUB style when appropriate) and local/generic travel tags; no misleading tags.",
  "Output language: match the listing title language where obvious; otherwise English.",
].join("\n");

export function buildSystemPrompt(): string {
  return [
    "You are a short-form social copywriter for verified vacation rental listings on LECIPM / BNHUB.",
    SAFETY_RULES,
    "Produce exactly five content packs, one per style: price_shock, lifestyle, comparison, question, hidden_gem.",
    "Each pack must include valid (boolean), invalidReason if valid is false, hook, script, caption, hashtags, overlayText (max 2 short lines), cta, safetyChecks (string array), requiredFieldsUsed (string array listing which input fields you relied on).",
    "If nightly price is missing or below minimum, set price_shock valid=false and leave hook/script/caption empty for that pack; explain in invalidReason.",
    "price_shock: only valid if nightly price is present; use actual price; no invented competitor prices.",
    "lifestyle: focus on amenities and room type; no invented scenes.",
    "comparison: soft compare vs generic hotel room; no real hotel names.",
    "question: engage with a question; answer only from provided facts.",
    "hidden_gem: city/region/neighborhood only; no fake landmarks.",
  ].join("\n\n");
}

export function buildUserPayload(input: ListingContentInput): string {
  const priceOk = Number.isFinite(input.nightPriceCents) && input.nightPriceCents >= 100;
  const priceMajor = (input.nightPriceCents / 100).toFixed(2);
  return JSON.stringify(
    {
      listing: {
        kind: input.listingKind,
        title: input.title,
        city: input.city,
        neighborhood: input.neighborhood ?? "",
        region: input.region ?? "",
        country: input.country ?? "",
        nightlyPriceCents: input.nightPriceCents,
        nightlyPriceFormatted: priceOk ? `${priceMajor} ${input.currency}` : "MISSING_OR_INVALID",
        propertyType: input.propertyType ?? "",
        roomType: input.roomType ?? "",
        maxGuests: input.maxGuests ?? null,
        amenities: input.amenities,
        descriptionExcerpt: (input.descriptionExcerpt ?? "").slice(0, 600),
        imageCount: input.imageUrls.length,
        sampleImageUrls: input.imageUrls.slice(0, 6),
        targetPlatform: input.targetPlatform,
        brandTone: input.brandTone,
      },
    },
    null,
    2
  );
}
