import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { trackPerformance } from "@/src/modules/ai-growth-engine/application/trackPerformance";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const itemId = String(body.itemId ?? "");
  const snapshotDate = body.snapshotDate ? new Date(String(body.snapshotDate)) : new Date();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const metrics = {
    views: Number(body.views ?? 0),
    clicks: Number(body.clicks ?? 0),
    conversions: Number(body.conversions ?? 0),
    engagement: Number(body.engagement ?? 0),
  };

  const row = await trackPerformance({
    itemId,
    snapshotDate,
    metrics,
    raw: typeof body.raw === "object" && body.raw ? (body.raw as Record<string, unknown>) : undefined,
  });

  return NextResponse.json({ snapshot: row });
}
