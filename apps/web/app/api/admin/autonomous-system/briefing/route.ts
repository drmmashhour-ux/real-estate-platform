import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { loadAutonomousSystemBriefing } from "@/lib/autonomy/briefing-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/autonomous-system/briefing — JSON status for AI assistant / control tower.
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const briefing = await loadAutonomousSystemBriefing();
  return NextResponse.json(briefing);
}
