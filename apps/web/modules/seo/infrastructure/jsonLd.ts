import { getSiteBaseUrl } from "../lib/siteBaseUrl";

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
