import { NextRequest, NextResponse } from "next/server";
import { requireStaffPortalSession } from "@/lib/admin/staff-portal-auth";
import { getPerformanceForUsers, listOpsUserIds } from "@/lib/team/team-queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/team/performance?days=14 — operator metrics (self only unless admin).
 */
export async function GET(req: NextRequest) {
  const auth = await requireStaffPortalSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const days = Math.min(90, Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("days") ?? "14", 10) || 14));
  const since = new Date(Date.now() - days * 86400000);

  if (auth.role !== "ADMIN") {
    const rows = await getPerformanceForUsers([auth.userId], since);
    return NextResponse.json({ days, since: since.toISOString(), members: rows });
  }

  const ids = await listOpsUserIds();
  const rows = await getPerformanceForUsers(ids, since);
  return NextResponse.json({ days, since: since.toISOString(), members: rows });
}
