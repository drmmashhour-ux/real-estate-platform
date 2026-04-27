import { NextRequest, NextResponse } from "next/server";
import { refreshLearningFromAbResults } from "@/lib/ab/learn";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/ab/learning/refresh — recompute winning variants from `growth_events`, upsert `learning_metrics`.
 * Schedule with your job runner: `Authorization: Bearer $CRON_SECRET`
 * Optional JSON body: `{ "days": 7 }` (1–180).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let days = 7;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === "object" && "days" in body) {
      const d = Number((body as { days?: unknown }).days);
      if (Number.isFinite(d)) days = Math.max(1, Math.min(180, Math.floor(d)));
    }
  } catch {
    /* use default */
  }

  try {
    const out = await refreshLearningFromAbResults(days);
    return NextResponse.json({ ok: true, days, ...out });
  } catch (e) {
    console.error("[internal/ab/learning/refresh]", e);
    return NextResponse.json({ error: "Learning refresh failed" }, { status: 500 });
  }
}
