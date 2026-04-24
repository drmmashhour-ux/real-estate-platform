import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { buildGuestRetentionInsights } from "@/modules/retention/insights.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/retention/me — guest retention snapshot (logged-in user only).
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const insights = await buildGuestRetentionInsights(userId);
  if (!insights) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });

  return NextResponse.json({ success: true, insights });
}
