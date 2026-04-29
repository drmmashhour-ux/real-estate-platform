import type { CaptionSafeInput } from "@/lib/listings/caption-input";

function pickTwo(list: string[]): [string, string] | null {
  const a = list[0];
  const b = list[1];
  if (a && b) return [a, b];
  if (a) return [a, a];
  return null;
}

/**
 * Deterministic fallback — never invents facts beyond supplied tokens.
 */
export function generateTemplateCaption(input: CaptionSafeInput): string {
  const beds = input.bedrooms != null ? `${input.bedrooms}-bedroom` : "";
  const bath =
    input.bathrooms != null ? `${input.bathrooms} bathroom${input.bathrooms === 1 ? "" : "s"}` : "";
  const city = input.city;
  const typeLine = input.propertyType.toLowerCase();
  const amenities = pickTwo(input.keyAmenities);
  const amenityPhrase = amenities
    ? `Features worth noting include ${amenities[0].replace(/_/g, " ")} and ${amenities[1].replace(/_/g, " ")}`
    : "Well-presented spaces throughout";

  const highlightPhrase =
    input.highlights[0] != null
      ? `Highlights include ${input.highlights[0].replace(/_/g, " ")}${input.highlights[1] ? ` and ${input.highlights[1].replace(/_/g, " ")}` : ""}.`
    : "";

  const area =
    input.surfaceSqft != null
      ? `Approximately ${input.surfaceSqft.toLocaleString("en-CA")} sq ft of living area`
      : "";
  const era =
    input.yearBuilt != null ? `Built in ${input.yearBuilt}` : "";

  const capacity =
    input.capacity != null && input.listingKind === "stay"
      ? `Comfortably accommodates up to ${input.capacity} guests.`
      : "";

  const hood = input.neighborhood ? ` in the ${input.neighborhood} area` : "";

  const parts = [
    `${input.title.trim()} — ${beds ? `a ${beds}` : "A"} ${typeLine}${hood ? ` ${hood}` : ""} in ${city}.`,
    bath ? `${bath.charAt(0).toUpperCase()}${bath.slice(1)}.` : "",
    area ? `${area}.` : "",
    era ? `${era}.` : "",
    capacity,
    `${amenityPhrase}.`,
    highlightPhrase,
    "Review photos and details carefully; agent coordination may apply before visits.",
  ].filter((p) => p.trim().length > 0);

  let text = parts.join(" ").replace(/\s+/g, " ").trim();

  if (text.length > 2400) {
    text = `${text.slice(0, 2397)}…`;
  }
  return text;
}
