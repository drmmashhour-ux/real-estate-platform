import { PLATFORM_NAME } from "@/lib/brand/platform";
import { getSiteBaseUrl } from "../lib/siteBaseUrl";

function toAbsoluteUrl(maybeUrl: string | null | undefined, base: string): string | undefined {
  if (!maybeUrl?.trim()) return undefined;
  const u = maybeUrl.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

/**
 * Short-term / vacation rental public page (schema.org VacationRental + nightly Offer).
 * @see https://schema.org/VacationRental
 */
export function vacationRentalListingJsonLd(input: {
  url: string;
  name: string;
  description: string;
  city: string;
  region?: string | null;
  country?: string | null;
  nightPriceCents: number;
  currency?: string;
  imageUrls?: string[];
  numberOfRooms?: number | null;
  /** e.g. Entire home, Private room (exposed as additionalProperty) */
  roomTypeLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const base = getSiteBaseUrl();
  const currency = (input.currency ?? "CAD").toUpperCase();
  const images = (input.imageUrls ?? []).map((u) => toAbsoluteUrl(u, base)).filter(Boolean) as string[];
  const geo =
    input.latitude != null && input.longitude != null
      ? {
          "@type": "GeoCoordinates",
          latitude: input.latitude,
          longitude: input.longitude,
        }
      : undefined;

  const extraProps: { "@type": string; name: string; value: string }[] = [];
  if (input.roomTypeLabel) {
    extraProps.push({ "@type": "PropertyValue", name: "roomType", value: input.roomTypeLabel });
  }

  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(images.length ? { image: images } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressRegion: input.region ?? undefined,
      addressCountry: input.country ?? "CA",
    },
    ...(geo ? { geo } : {}),
    ...(input.numberOfRooms != null && input.numberOfRooms > 0
      ? { numberOfRooms: input.numberOfRooms }
      : {}),
    ...(extraProps.length ? { additionalProperty: extraProps } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: (input.nightPriceCents / 100).toFixed(2),
      unitCode: "DAY",
      availability: "https://schema.org/InStock",
      url: input.url,
    },
  };
}

/**
 * For-sale or marketplace listing as schema.org Product + Offer (real estate category).
 */
/**
 * schema.org RealEstateListing (for-sale / FSBO public pages).
 * @see https://schema.org/RealEstateListing
 */
export function realEstateListingJsonLd(input: {
  url: string;
  name: string;
  description: string;
  city: string;
  streetAddress?: string | null;
  priceCents: number;
  currency?: string;
  imageUrls?: string[];
  numberOfRooms?: number | null;
}) {
  const base = getSiteBaseUrl();
  const currency = (input.currency ?? "CAD").toUpperCase();
  const images = (input.imageUrls ?? []).map((u) => toAbsoluteUrl(u, base)).filter(Boolean) as string[];

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(images.length ? { image: images } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: input.streetAddress ?? undefined,
      addressLocality: input.city,
      addressCountry: "CA",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: (input.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: input.url,
    },
    ...(input.numberOfRooms != null && input.numberOfRooms > 0
      ? { numberOfRooms: input.numberOfRooms }
      : {}),
  };
}

export function realEstateProductJsonLd(input: {
  url: string;
  name: string;
  description: string;
  city: string;
  priceCents: number;
  currency?: string;
  imageUrls?: string[];
  numberOfRooms?: number | null;
  /** e.g. SingleFamilyResidence, Apartment */
  propertyTypeHint?: string | null;
}) {
  const base = getSiteBaseUrl();
  const currency = (input.currency ?? "CAD").toUpperCase();
  const images = (input.imageUrls ?? []).map((u) => toAbsoluteUrl(u, base)).filter(Boolean) as string[];

  const additional: { "@type": string; name: string; value: string }[] = [
    { "@type": "PropertyValue", name: "city", value: input.city },
  ];
  if (input.numberOfRooms != null) {
    additional.push({ "@type": "PropertyValue", name: "numberOfRooms", value: String(input.numberOfRooms) });
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    category: input.propertyTypeHint ?? "Real estate listing",
    ...(images.length ? { image: images } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: (input.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: input.url,
    },
    additionalProperty: additional,
  };
}

/** Product-style offer for a listing analysis page (schema.org). */
export function listingAnalysisJsonLd(input: {
  url: string;
  name: string;
  description: string;
  city: string;
  priceCents: number;
  currency?: string;
}) {
  const currency = input.currency ?? "CAD";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    offers: {
      "@type": "Offer",
      priceCurrency: currency,
      price: (input.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
    category: "Real estate listing analysis",
    additionalProperty: [
      { "@type": "PropertyValue", name: "city", value: input.city },
    ],
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  excerpt: string | null;
  slug: string;
  publishedAt: Date;
}) {
  const base = getSiteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.title,
    url: `${base}/blog/${post.slug}`,
    datePublished: post.publishedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      name: PLATFORM_NAME,
      url: base,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const base = getSiteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${base}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    })),
  };
}
