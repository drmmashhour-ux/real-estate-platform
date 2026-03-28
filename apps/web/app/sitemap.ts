import type { MetadataRoute } from "next";
import { ListingStatus } from "@prisma/client";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";
import { BLOG_POSTS } from "@/lib/content/blog-posts";
import { GROWTH_CITY_SLUGS } from "@/lib/growth/geo-slugs";
import { listDistinctCitiesWithData } from "@/lib/market/data";
import { cityToSlug } from "@/lib/market/slug";
import { prisma } from "@/lib/db";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { buildBnhubStaySeoSlug, buildFsboPublicListingPath } from "@/lib/seo/public-urls";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();
  const now = new Date();

  const staticPaths = [
    "/",
    "/blog",
    "/market",
    "/listings",
    "/buy",
    "/rent",
    "/bnhub",
    "/bnhub/stays",
    "/search/bnhub",
    "/marketplace",
    "/tools/roi-calculator",
    "/tools/deal-analyzer",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

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
        where: { status: FSBO_STATUS.ACTIVE, moderationStatus: FSBO_MODERATION.APPROVED },
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

  for (const city of cities) {
    const slug = cityToSlug(city);
    entries.push({
      url: `${base}/market/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  for (const l of listings) {
    const citySlug = cityToSlug(l.city);
    entries.push({
      url: `${base}/analysis/${citySlug}/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
    entries.push({
      url: `${base}${buildFsboPublicListingPath(l)}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.72,
    });
  }

  for (const b of bnhubPublished) {
    const staySlug = buildBnhubStaySeoSlug({
      id: b.id,
      city: b.city,
      propertyType: b.propertyType,
    });
    entries.push({
      url: `${base}/stays/${encodeURIComponent(staySlug)}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly",
      priority: 0.72,
    });
  }

  for (const slug of GROWTH_CITY_SLUGS) {
    entries.push(
      {
        url: `${base}/buy/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.68,
      },
      {
        url: `${base}/rent/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.68,
      },
      {
        url: `${base}/mortgage/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.65,
      },
    );
  }

  for (const p of BLOG_POSTS) {
    entries.push({
      url: `${base}/blog/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

  const staticSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
  for (const p of dbPosts) {
    if (staticSlugs.has(p.slug)) continue;
    entries.push({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.65,
    });
  }

  return entries;
}
