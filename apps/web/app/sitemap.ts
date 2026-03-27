import type { MetadataRoute } from "next";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";
import { BLOG_POSTS } from "@/lib/content/blog-posts";
import { listDistinctCitiesWithData } from "@/lib/market/data";
import { cityToSlug } from "@/lib/market/slug";
import { prisma } from "@/lib/db";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();
  const now = new Date();

  const staticPaths = [
    "/",
    "/blog",
    "/market",
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
  let listings: Array<{ id: string; city: string; updatedAt: Date }> = [];
  let dbPosts: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    [cities, listings, dbPosts] = await Promise.all([
      listDistinctCitiesWithData(),
      prisma.fsboListing.findMany({
        where: { status: FSBO_STATUS.ACTIVE, moderationStatus: FSBO_MODERATION.APPROVED },
        select: { id: true, city: true, updatedAt: true },
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
