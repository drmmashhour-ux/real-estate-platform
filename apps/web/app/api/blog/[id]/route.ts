import { NextResponse } from "next/server";
import { MarketingBlogPostStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { blogPatchBodySchema, deleteMarketingBlogPost, updateMarketingBlogPost } from "@/modules/blog";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function blogDisabled() {
  if (!engineFlags.blogSystemV1) return jsonError("Blog system is disabled", 403);
  return null;
}

/** GET /api/blog/[id] */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const d = blogDisabled();
  if (d) return d;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!id?.trim()) return jsonError("Not found", 404);

  const row = await prisma.marketingBlogPost.findFirst({
    where: { id: id.trim(), userId: auth.userId },
  });
  if (!row) return jsonError("Not found", 404);

  return NextResponse.json({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  });
}

/** PATCH /api/blog/[id] */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const d = blogDisabled();
  if (d) return d;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!id?.trim()) return jsonError("Not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = blogPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join("; ") || "Invalid body", 400);
  }

  const p = parsed.data;
  const updated = await updateMarketingBlogPost(id.trim(), auth.userId, {
    ...(p.title !== undefined ? { title: p.title } : {}),
    ...(p.slug !== undefined ? { slug: p.slug } : {}),
    ...(p.content !== undefined ? { content: p.content } : {}),
    ...(p.coverImageUrl !== undefined ? { coverImageUrl: p.coverImageUrl } : {}),
    ...(p.tags !== undefined ? { tags: p.tags } : {}),
    ...(p.seoTitle !== undefined ? { seoTitle: p.seoTitle } : {}),
    ...(p.seoDescription !== undefined ? { seoDescription: p.seoDescription } : {}),
    ...(p.status !== undefined
      ? {
          status:
            p.status === "PUBLISHED" ? MarketingBlogPostStatus.PUBLISHED : MarketingBlogPostStatus.DRAFT,
        }
      : {}),
  });
  if (!updated) return jsonError("Not found", 404);

  return NextResponse.json({ ok: true });
}

/** DELETE /api/blog/[id] */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const d = blogDisabled();
  if (d) return d;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!id?.trim()) return jsonError("Not found", 404);

  const ok = await deleteMarketingBlogPost(id.trim(), auth.userId);
  if (!ok) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
}
