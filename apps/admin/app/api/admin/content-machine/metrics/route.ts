import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { recordContentMetrics } from "@/lib/content-machine/pipeline";

export const dynamic = "force-dynamic";

/** Manual / webhook: bump views, clicks, conversions for a content piece */
export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    contentId?: unknown;
    views?: unknown;
    clicks?: unknown;
    conversions?: unknown;
  };
  const contentId = typeof body.contentId === "string" ? body.contentId.trim() : "";
  if (!contentId) {
    return NextResponse.json({ error: "contentId required" }, { status: 400 });
  }

  await recordContentMetrics(contentId, {
    views: typeof body.views === "number" ? body.views : undefined,
    clicks: typeof body.clicks === "number" ? body.clicks : undefined,
    conversions: typeof body.conversions === "number" ? body.conversions : undefined,
  });
  return NextResponse.json({ ok: true });
}
