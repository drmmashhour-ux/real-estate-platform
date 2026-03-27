import { prisma } from "@/lib/db";
import { BLOG_POSTS } from "./blog-posts";

export type BlogIndexRow = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  source: "static" | "db";
};

/** Static + `SeoBlogPost` (DB wins on slug collision). Sorted newest first. */
export async function getBlogIndexRows(): Promise<BlogIndexRow[]> {
  let dbPosts: { slug: string; title: string; excerpt: string | null; publishedAt: Date }[] = [];
  try {
    dbPosts = await prisma.seoBlogPost.findMany({
      where: { publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true, excerpt: true, publishedAt: true },
    });
  } catch {
    // `seo_blog_posts` may not exist until migration is applied.
  }
  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const staticRows: BlogIndexRow[] = BLOG_POSTS.filter((p) => !dbSlugs.has(p.slug)).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    publishedAt: new Date(`${p.publishedIso}T12:00:00Z`),
    source: "static",
  }));
  const dbRows: BlogIndexRow[] = dbPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.excerpt ?? p.title,
    publishedAt: p.publishedAt,
    source: "db",
  }));
  return [...dbRows, ...staticRows].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
