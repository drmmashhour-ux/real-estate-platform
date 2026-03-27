/**
 * AI listing optimization – title/description rewrites and SEO keywords.
 * Deterministic rules; replace with model calls when ready.
 */

import type { ListingInput } from "./brain";

export type OptimizeResult = {
  optimizedTitle: string;
  optimizedDescription: string;
  seoKeywords: string[];
  improvements: string[];
};

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

export function rewriteTitle(listing: ListingInput): string {
  const title = str(listing?.title);
  const city = str(listing?.location?.city);
  const address = str(listing?.location?.address);
  const photoCount = Array.isArray(listing?.photos) ? listing.photos.length : 0;
  if (!title) {
    const parts = ["Property"];
    if (city) parts.push(`in ${city}`);
    if (address) parts.push(address);
    if (photoCount > 0) parts.push(`${photoCount} photos`);
    return parts.join(" ");
  }
  let out = title;
  if (!/luxury|modern|stunning|beautiful|spacious|new|renovated/i.test(out)) {
    out = `Stunning ${out}`;
  }
  return out.slice(0, 120);
}

export function rewriteDescription(listing: ListingInput): string {
  const desc = str(listing?.description);
  const city = str(listing?.location?.city);
  const address = str(listing?.location?.address);
  const photoCount = Array.isArray(listing?.photos) ? listing.photos.length : 0;
  let out = desc || "This property offers excellent value and location.";
  if (city && !out.toLowerCase().includes(city.toLowerCase())) {
    out = `Located in ${city}. ${out}`;
  }
  if (address && !out.toLowerCase().includes(address.toLowerCase())) {
    out += ` Address: ${address}.`;
  }
  if (photoCount > 0 && !/photo|image|gallery/i.test(out)) {
    out += ` Includes ${photoCount} curated photo(s) to help buyers review the space.`;
  }
  if (!/schedule|viewing|contact|call|today|reach out/i.test(out)) {
    out += " Schedule a viewing today — contact us for more details.";
  }
  return out;
}

export function addSeoKeywords(listing: ListingInput): string[] {
  const keywords: string[] = ["real estate", "property"];
  const city = str(listing?.location?.city);
  const title = str(listing?.title);
  if (city) keywords.push(`${city} real estate`, `${city} property`);
  if (/luxury|luxurious/i.test(title)) keywords.push("luxury home", "luxury property");
  if (/condo|apartment/i.test(title)) keywords.push("condo", "apartment");
  if (/house|home|villa/i.test(title)) keywords.push("house for sale", "family home");
  if (Array.isArray(listing?.amenities) && listing.amenities.length > 0) keywords.push(listing.amenities[0]);
  return [...new Set(keywords)].slice(0, 12);
}

export function optimizeListing(listing: ListingInput): OptimizeResult {
  const optimizedTitle = rewriteTitle(listing);
  const optimizedDescription = rewriteDescription(listing);
  const seoKeywords = addSeoKeywords(listing);
  const improvements: string[] = [];
  if (optimizedTitle !== str(listing?.title)) improvements.push("Title enhanced with price and power words");
  if (optimizedDescription !== str(listing?.description)) improvements.push("Description expanded with location and CTA");
  if (seoKeywords.length > 0) improvements.push(`Added ${seoKeywords.length} SEO keywords`);
  return { optimizedTitle, optimizedDescription, seoKeywords, improvements };
}
