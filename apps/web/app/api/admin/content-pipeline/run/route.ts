import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { runListingContentPipeline } from "@/lib/bnhub/content-pipeline/run-pipeline";

export const dynamic = "force-dynamic";

/** Manual (re)run TikTok + downstream pipeline for a BNHUB listing */
export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json().catch(() => ({}))) as { listingId?: unknown };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const result = await runListingContentPipeline(listingId, "manual", { force: true });
  if ("skipped" in result) {
    return NextResponse.json({ ok: false, skipped: true, reason: result.reason }, { status: 200 });
  }
  return NextResponse.json({ ok: true, contentGeneratedId: result.id });
}
