import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { listRecentFraudEvents } from "@/modules/fraud/fraud-event-log.service";

export const dynamic = "force-dynamic";

/** GET /api/fraud/events — recent rows from `fraud_events` (admin only). */
export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const url = new URL(req.url);
  const take = Math.min(200, Math.max(1, parseInt(url.searchParams.get("take") ?? "80", 10) || 80));
  const rows = await listRecentFraudEvents(take);
  return NextResponse.json({ ok: true, events: rows });
}
