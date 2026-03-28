/**
 * JSON-LD helpers for growth SEO surfaces (stays, cities, property hubs).
 */

export function jsonLdScript(json: Record<string, unknown>) {
  return JSON.stringify(json);
}

export function breadcrumbListJsonLd(items: { name: string; path: string }[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${baseUrl.replace(/\/$/, "")}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    })),
  };
}

export function vacationRentalJsonLd(input: {
  name: string;
  description: string;
  city: string;
  country?: string;
  url: string;
  image?: string | null;
  priceCurrency?: string;
  lowPrice?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressCountry: input.country ?? "CA",
    },
    ...(input.lowPrice != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: input.priceCurrency ?? "CAD",
            price: input.lowPrice,
          },
        }
      : {}),
  };
}

export function webPageJsonLd(input: { name: string; description: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: input.url,
  };
}
