import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { recordFunnelStep } from "@/modules/funnel/funnel.service";
import { prisma } from "@repo/db";
import { MarketingSystemEventCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  blogId: z.string().min(1).max(64),
  slug: z.string().max(200).optional(),
  sessionId: z.string().max(128).optional(),
  /** "view" = landing on post; "click" = explicit CTA/share (optional second signal). */
  kind: z.enum(["blog_view", "blog_click"]).default("blog_view"),
});

/**
 * Public blog engagement — one deduped funnel row per user/session/post/day (view),
 * plus optional extra blog_click for share/CTA (deduped separately).
 */
export async function POST(req: Request) {
  if (!engineFlags.marketingIntelligenceV1) {
    return NextResponse.json({ ok: false, skipped: "disabled" }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  const post = await prisma.marketingBlogPost.findUnique({
    where: { id: parsed.data.blogId },
    select: { id: true, status: true },
  });
  if (!post || post.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  const dayKey = new Date().toISOString().slice(0, 10);
  const kind = parsed.data.kind;
  const idem = `mi:blog:${kind}:${parsed.data.blogId}:${userId ?? "anon"}:${parsed.data.sessionId ?? "nosess"}:${dayKey}`;

  const existing = await prisma.marketingSystemEvent.findFirst({
    where: {
      category: MarketingSystemEventCategory.FUNNEL,
      eventKey: kind,
      subjectType: "blog",
      subjectId: parsed.data.blogId,
      meta: { path: ["idempotencyKey"], equals: idem },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await recordFunnelStep({
    step: kind,
    userId,
    sessionId: parsed.data.sessionId ?? null,
    blogId: parsed.data.blogId,
    meta: {
      idempotencyKey: idem,
      slug: parsed.data.slug ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
