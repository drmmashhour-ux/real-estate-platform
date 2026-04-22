import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { approveMarketingPost, updateMarketingCaption } from "@/modules/marketing/marketing-admin-actions.service";

export const dynamic = "force-dynamic";

/** PATCH caption edit */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json()) as { caption?: string };
  if (!body.caption?.trim()) {
    return NextResponse.json({ error: "caption_required" }, { status: 400 });
  }

  await updateMarketingCaption(id, body.caption);
  return NextResponse.json({ ok: true });
}

/** POST approve + schedule — body { scheduledAt: ISO string } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json()) as { scheduledAt?: string };
  if (!body.scheduledAt) {
    return NextResponse.json({ error: "scheduledAt_required" }, { status: 400 });
  }

  const when = new Date(body.scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const r = await approveMarketingPost(id, when);
  if (!r.ok) return NextResponse.json(r, { status: 400 });
  return NextResponse.json({ ok: true });
}
