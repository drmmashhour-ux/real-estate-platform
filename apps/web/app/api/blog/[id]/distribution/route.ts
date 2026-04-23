import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { publishBlogDistribution } from "@/modules/distribution";

export const dynamic = "force-dynamic";

/** GET /api/blog/[id]/distribution — COPY MODE pack + share URLs (no auto-post). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!engineFlags.blogSystemV1 || !engineFlags.distributionV1) {
    return NextResponse.json({ error: "Distribution is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id?.trim()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await prisma.marketingBlogPost.findFirst({
    where: { id: id.trim(), userId: auth.userId },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3001";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;
  const slug = post.slug;

  const pack = publishBlogDistribution(post, {
    publicUrl: `${origin}/marketing-blog/${slug}`,
    city: "Montréal",
  });

  return NextResponse.json({ pack, mode: "COPY_AND_SHARE_LINKS" });
}
