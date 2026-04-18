import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { getPublishedBySlug } from "@/modules/blog/blog.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/blog/slug/[slug] — public published post (read-only).
 * Matches intent of GET /api/blog/[slug] without conflicting with [id] routes.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!engineFlags.blogSystemV1) {
    return NextResponse.json({ error: "Blog system is disabled" }, { status: 403 });
  }
  const { slug } = await ctx.params;
  if (!slug?.trim()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await getPublishedBySlug(slug.trim());
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    tags: row.tags,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  });
}
