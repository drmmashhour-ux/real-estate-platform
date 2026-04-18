import { NextResponse } from "next/server";
import { MarketingBlogPostStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import {
  blogCreateBodySchema,
  createMarketingBlogPost,
  ensureUniqueSlug,
} from "@/modules/blog";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function blogDisabled() {
  if (!engineFlags.blogSystemV1) return jsonError("Blog system is disabled", 403);
  return null;
}

/** GET /api/blog — list current user's posts */
export async function GET() {
  const d = blogDisabled();
  if (d) return d;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const rows = await prisma.marketingBlogPost.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      coverImageUrl: true,
      tags: true,
      updatedAt: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({
    posts: rows.map((r) => ({
      ...r,
      updatedAt: r.updatedAt.toISOString(),
      publishedAt: r.publishedAt?.toISOString() ?? null,
    })),
  });
}

/** POST /api/blog */
export async function POST(req: Request) {
  const d = blogDisabled();
  if (d) return d;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = blogCreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join("; ") || "Invalid body", 400);
  }

  const slug =
    parsed.data.slug ??
    (await ensureUniqueSlug(parsed.data.title));

  const status: MarketingBlogPostStatus =
    parsed.data.status === "PUBLISHED" ? MarketingBlogPostStatus.PUBLISHED : MarketingBlogPostStatus.DRAFT;

  try {
    const post = await createMarketingBlogPost({
      userId: auth.userId,
      title: parsed.data.title,
      slug,
      content: parsed.data.content,
      coverImageUrl: parsed.data.coverImageUrl,
      tags: parsed.data.tags,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
      status,
    });
    return NextResponse.json({ id: post.id, slug: post.slug });
  } catch (e) {
    console.error("[api/blog POST]", e);
    return jsonError("Could not create post", 500);
  }
}
