import type {
  SeoCityPageInput,
  SeoListingMetaInput,
  SeoMetadataBundle,
  SeoResidenceMetaInput,
  SeoStayMetaInput,
} from "./seo-engine.types";

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function regionSuffix(province?: string, country?: string): string {
  const p = province?.trim();
  const c = country?.trim();
  if (p && c) return `${p}, ${c}`;
  if (p) return p;
  if (c) return c;
  return "";
}

/**
 * Listing detail pages — factual title + description; no fake inventory.
 */
export function generateListingMetadata(input: SeoListingMetaInput): SeoMetadataBundle {
  const region = regionSuffix(input.province, input.country);
  const cat = input.propertyCategory?.trim() || "Property";
  const baseTitle = `${input.title.trim()} | ${cat} in ${input.city.trim()}${region ? `, ${region}` : ""} | LECIPM`;
  const title = truncate(baseTitle, 60);
  const metaDescription = truncate(
    `View this ${cat.toLowerCase()} listing in ${input.city.trim()} on LECIPM — verified brokerage marketplace experience.${input.priceLabel ? ` ${input.priceLabel}.` : ""} Search, compare, and connect with confidence.`,
    155
  );
  const path = input.listingUrlPath?.trim() || `/listings`;
  return {
    title,
    metaDescription,
    canonicalPathSuggestion: path,
    ogTitle: title,
    ogDescription: metaDescription,
    structuredSnippet: "Real estate listing — informational metadata for search.",
  };
}

/** Area / city hub pages — informational; no inventory guarantees. */
export function generateCityPageMetadata(input: SeoCityPageInput): SeoMetadataBundle {
  const c = input.city.trim() || "Montreal";
  const type = input.pageFocus;
  const reg = input.province?.trim();

  const focusLabel =
    type === "luxury"
      ? "Luxury homes"
      : type === "rent"
        ? "Rentals"
        : type === "stays"
          ? "Short-term stays"
          : type === "investor"
            ? "Investment insights"
            : type === "residence_services"
              ? "Residence services"
              : "Homes for sale";

  const title = truncate(`${focusLabel} in ${c}${reg ? `, ${reg}` : ""} | LECIPM`, 60);
  const metaDescription = truncate(
    `Explore ${focusLabel.toLowerCase()} in ${c} on LECIPM — curated discovery, transparent brokerage tools, and neighborhood context. Content is informational; listings vary by availability.`,
    155
  );
  const slug = c.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/gi, "");
  const route =
    type === "stays"
      ? `/bnhub/stays?city=${encodeURIComponent(c)}`
      : type === "residence_services"
        ? `/residence-services`
        : `/city/${slug}`;

  return {
    title,
    metaDescription,
    canonicalPathSuggestion: route,
    ogTitle: title,
    ogDescription: metaDescription,
  };
}

/** BNHub stay detail — hospitality positioning, no guaranteed availability. */
export function generateStayMetadata(input: SeoStayMetaInput): SeoMetadataBundle {
  const nb = input.neighborhood?.trim();
  const geo = nb ? `${nb}, ${input.city.trim()}` : input.city.trim();
  const title = truncate(`${input.title.trim()} | Stay in ${geo} | LECIPM BNHub`, 60);
  const metaDescription = truncate(
    `Discover this BNHub stay in ${geo}.${input.nightlyPriceLabel ? ` From ${input.nightlyPriceLabel}.` : ""} Book with transparent pricing on LECIPM — availability depends on host calendar.`,
    155
  );
  const path = input.stayUrlPath?.trim() || `/bnhub/listings`;
  return {
    title,
    metaDescription,
    canonicalPathSuggestion: path,
    ogTitle: title,
    ogDescription: metaDescription,
  };
}

/** Residence services — coordination marketplace only (see guardrails). */
export function generateResidenceMetadata(input: SeoResidenceMetaInput): SeoMetadataBundle {
  const title = truncate(`${input.residenceName.trim()} | Residence services in ${input.city.trim()} | LECIPM`, 60);
  const metaDescription = truncate(
    `Explore ${input.residenceName.trim()} — residence services coordination in ${input.city.trim()} on LECIPM. Services are provided by the residence; LECIPM does not provide healthcare or clinical monitoring.`,
    155
  );
  const path = input.residenceServicesUrlPath?.trim() || `/residence-services`;
  return {
    title,
    metaDescription,
    canonicalPathSuggestion: path,
    ogTitle: title,
    ogDescription: metaDescription,
    structuredSnippet: "Coordination platform only — not medical advice.",
  };
}
