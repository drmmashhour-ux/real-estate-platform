import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordDmVariantReply, recordDmVariantUse } from "@/src/modules/daily-execution/application/dailyMetricsService";

const ALLOWED = new Set(["curiosity", "problem_focused", "direct_value"]);

export const dynamic = "force-dynamic";

/** POST { variant, event: "use" | "reply" } — script testing stats only. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { variant?: string; event?: string };
  const variant = typeof body.variant === "string" ? body.variant.trim() : "";
  const event = body.event === "reply" ? "reply" : body.event === "use" ? "use" : "";

  if (!ALLOWED.has(variant) || (event !== "use" && event !== "reply")) {
    return NextResponse.json({ error: "Invalid variant or event" }, { status: 400 });
  }

  if (event === "use") await recordDmVariantUse(prisma, userId, variant);
  else await recordDmVariantReply(prisma, userId, variant);

  return NextResponse.json({ ok: true });
}
