import type { MetadataRoute } from "next";
import { ListingStatus } from "@prisma/client";
import { getCountryBySlug, isLocaleAllowedForCountry, ROUTED_COUNTRY_SLUGS } from "@/config/countries";
import { BLOG_POSTS } from "@/lib/content/blog-posts";
import { CITY_SLUGS, type CitySlug } from "@/lib/geo/city-search";
import { listNeighborhoodSlugs } from "@/src/modules/demand-engine/neighborhoodRegistry";
import { GROWTH_CITY_SLUGS } from "@/lib/growth/geo-slugs";
import { listDistinctCitiesWithData } from "@/lib/market/data";
import { cityToSlug } from "@/lib/market/slug";
import { prisma } from "@repo/db";
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { buildBnhubStaySeoSlug, buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import { routing } from "@/i18n/routing";
import { GROWTH_SEO_SLUGS } from "@/modules/growth/seo/seo-page.service";

export const revalidate = 3600;

function withLocaleCountryPrefix(path: string, locale: string, country: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/") return `/${locale}/${country}`;
  return `/${locale}/${country}${p}`;
}

function forEachRoutedLocaleCountry(cb: (locale: string, country: string) => void) {
  for (const country of ROUTED_COUNTRY_SLUGS) {
    const def = getCountryBySlug(country);
    if (!def) continue;
    for (const loc of routing.locales) {
      if (!isLocaleAllowedForCountry(loc, def)) continue;
      cb(loc, country);
    }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();
  const now = new Date();

  const staticPaths = [
    "/",
    "/demos",
    "/blog",
    "/market",
    "/listings",
    "/explore",
    "/selling/by-yourself",
    "/buy",
    "/rent",
    "/rent/packages",
    "/bnhub",
    "/bnhub/stays",
    "/bnhub/montreal",
    "/bnhub/laval",
    "/invest/montreal",
    "/rent/montreal",
    "/rent/laval",
    "/search/bnhub",
    "/marketplace",
    "/tools/roi-calculator",
    "/tools/deal-analyzer",
    "/senior-living",
  ];

  const entries: MetadataRoute.Sitemap = [];
  forEachRoutedLocaleCountry((loc, country) => {
    for (const path of staticPaths) {
      entries.push({
        url: `${base}${withLocaleCountryPrefix(path, loc, country)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "/" ? 1 : 0.8,
      });
    }
  });

  forEachRoutedLocaleCountry((loc, country) => {
    for (const slug of GROWTH_SEO_SLUGS) {
      entries.push({
        url: `${base}${withLocaleCountryPrefix(`/growth-seo/${slug}`, loc, country)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.72,
      });
    }
  });

  let cities: string[] = [];
  let listings: Array<{ id: string; city: string; propertyType: string | null; updatedAt: Date }> = [];
  let bnhubPublished: Array<{
    id: string;
    city: string;
    propertyType: string | null;
    listingCode: string;
    updatedAt: Date;
  }> = [];
  let dbPosts: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    [cities, listings, bnhubPublished, dbPosts] = await Promise.all([
      listDistinctCitiesWithData(),
      prisma.fsboListing.findMany({
        where: buildFsboPublicVisibilityWhere(now),
        select: { id: true, city: true, propertyType: true, updatedAt: true },
      }),
      prisma.shortTermListing.findMany({
        where: { listingStatus: ListingStatus.PUBLISHED },
        select: { id: true, city: true, propertyType: true, listingCode: true, updatedAt: true },
      }),
      prisma.seoBlogPost.findMany({
        where: { publishedAt: { lte: now } },
        select: { slug: true, updatedAt: true },
      }),
    ]);
  } catch {
    // Build/DB without latest migration: still emit static SEO URLs.
  }

  forEachRoutedLocaleCountry((loc, country) => {
    for (const city of cities) {
      const slug = cityToSlug(city);
      entries.push({
        url: `${base}${withLocaleCountryPrefix(`/market/${slug}`, loc, country)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  });

  forEachRoutedLocaleCountry((loc, country) => {
    for (const l of listings) {
      const citySlug = cityToSlug(l.city);
      entries.push({
        url: `${base}${withLocaleCountryPrefix(`/analysis/${citySlug}/${l.id}`, loc, country)}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      entries.push({
        url: `${base}${withLocaleCountryPrefix(buildFsboPublicListingPath(l), loc, country)}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly",
        priority: 0.72,
      });
    }
  });

  forEachRoutedLocaleCountry((loc, country) => {
    for (const b of bnhubPublished) {
      const staySlug = buildBnhubStaySeoSlug({
        id: b.id,
        city: b.city,
        propertyType: b.propertyType,
      });
      entries.push({
        url: `${base}${withLocaleCountryPrefix(`/stays/${encodeURIComponent(staySlug)}`, loc, country)}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly",
        priority: 0.72,
      });
    }
  });

  forEachRoutedLocaleCountry((loc, country) => {
    for (const slug of CITY_SLUGS) {
      entries.push({
        url: `${base}${withLocaleCountryPrefix(`/city/${slug}`, loc, country)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.72,
      });
      entries.push(
        {
          url: `${base}${withLocaleCountryPrefix(`/city/${slug}/brokers`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.71,
        },
        {
          url: `${base}${withLocaleCountryPrefix(`/city/${slug}/rentals`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.71,
        }
      );
      for (const area of listNeighborhoodSlugs(slug as CitySlug)) {
        entries.push({
          url: `${base}${withLocaleCountryPrefix(`/city/${slug}/n/${area}`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  });

  forEachRoutedLocaleCountry((loc, country) => {
    for (const slug of GROWTH_CITY_SLUGS) {
      entries.push(
        {
          url: `${base}${withLocaleCountryPrefix(`/city/${slug}/buy`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        },
        {
          url: `${base}${withLocaleCountryPrefix(`/city/${slug}/rent`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        },
        {
          url: `${base}${withLocaleCountryPrefix(`/city/${slug}/investment`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.69,
        },
        {
          url: `${base}${withLocaleCountryPrefix(`/buy/${slug}`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.68,
        },
        {
          url: `${base}${withLocaleCountryPrefix(`/rent/${slug}`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.68,
        },
        {
          url: `${base}${withLocaleCountryPrefix(`/mortgage/${slug}`, loc, country)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.65,
        },
      );
    }
  });

  forEachRoutedLocaleCountry((loc, country) => {
    for (const p of BLOG_POSTS) {
      entries.push({
        url: `${base}${withLocaleCountryPrefix(`/blog/${p.slug}`, loc, country)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.65,
      });
    }
  });

  const staticSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
  forEachRoutedLocaleCountry((loc, country) => {
    for (const p of dbPosts) {
      if (staticSlugs.has(p.slug)) continue;
      entries.push({
        url: `${base}${withLocaleCountryPrefix(`/blog/${p.slug}`, loc, country)}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  });

  return entries;
}
