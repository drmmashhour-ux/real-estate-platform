import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import type { SessionSummary } from "@/modules/live-training/live-training.types";

export const dynamic = "force-dynamic";

/** Persists summary client-side primarily; endpoint validates auth for mobile/sync clients. */
export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await req.json()) as { summary?: SessionSummary };
    if (!body.summary?.sessionId) {
      return NextResponse.json({ error: "summary_required" }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      receivedAt: new Date().toISOString(),
      summaryId: body.summary.sessionId,
      note: "Persist in desktop client via localStorage; attach server persistence here if desired.",
    });
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
}
