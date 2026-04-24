import { requireAdmin } from "@/modules/security/access-guard.service";
import { getFundraisingStats } from "@/modules/investor/reporting.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/investors/stats — aggregate fundraising performance
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const stats = await getFundraisingStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[investor:api] stats failed", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
