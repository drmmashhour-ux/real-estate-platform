export type PropertyInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  city?: string | null;
  country?: string | null;
  nightPriceCents?: number | null;
  beds?: number | null;
  baths?: number | null;
  maxGuests?: number | null;
  amenities?: string[] | null;
};

export type GeneratedListingContent = {
  title: string;
  description: string;
  highlights: string[];
  tags: string[];
};

export function generateListingContent(property: PropertyInput): GeneratedListingContent {
  const location = [property.city, property.country].filter(Boolean).join(", ") || "Great location";
  const price = property.nightPriceCents != null ? property.nightPriceCents / 100 : 0;
  const beds = property.beds ?? 0;
  const baths = property.baths ?? 0;
  const guests = property.maxGuests ?? 0;

  const title = property.title?.trim() || `Property in ${location}`;
  const description =
    property.description?.trim() ||
    `${title}. ${beds} beds, ${baths} baths, up to ${guests} guests. Located in ${location}.`;

  const highlights: string[] = [];
  if (location) highlights.push(location);
  if (price > 0) highlights.push(`From €${price}/night`);
  if (guests > 0) highlights.push(`Up to ${guests} guests`);
  if (beds > 0) highlights.push(`${beds} bed${beds !== 1 ? "s" : ""}`);
  if (baths > 0) highlights.push(`${baths} bath${baths !== 1 ? "s" : ""}`);
  if (property.amenities?.length) highlights.push(...property.amenities.slice(0, 5));

  const tags: string[] = [];
  if (property.city) tags.push(property.city);
  if (property.country) tags.push(property.country);
  if (guests > 4) tags.push("Large group");
  if (price > 0 && price < 80) tags.push("Budget-friendly");
  if (price > 150) tags.push("Premium");

  return {
    title: title.slice(0, 120),
    description: description.slice(0, 2000),
    highlights: [...new Set(highlights)].slice(0, 10),
    tags: [...new Set(tags)].slice(0, 8),
  };
}
