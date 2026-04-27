import { NextRequest, NextResponse } from "next/server";
import { decayAllUserPreferencesWeights, decayUserPreferencesWeights } from "@/lib/ai/preferences";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/user-preferences/decay — multiply all preference weights (default 0.95) for freshness.
 * Optional JSON: `{ "userId": "..." }` to decay a single user; omit for global. `Authorization: Bearer $CRON_SECRET`.
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

  let factor = 0.95;
  let userId: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === "object") {
      if ("factor" in body) {
        const f = Number((body as { factor?: unknown }).factor);
        if (Number.isFinite(f) && f > 0 && f < 1) factor = f;
      }
      const uid = (body as { userId?: unknown }).userId;
      if (typeof uid === "string" && uid.length > 0) {
        userId = uid;
      }
    }
  } catch {
    /* defaults */
  }

  try {
    if (userId) {
      await decayUserPreferencesWeights(userId, factor);
      return NextResponse.json({ ok: true, scope: "user" as const, userId, factor });
    }
    await decayAllUserPreferencesWeights(factor);
    return NextResponse.json({ ok: true, scope: "global" as const, factor });
  } catch (e) {
    console.error("[internal/user-preferences/decay]", e);
    return NextResponse.json({ error: "Decay failed" }, { status: 500 });
  }
}
