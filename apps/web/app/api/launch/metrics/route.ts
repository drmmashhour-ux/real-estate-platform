import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getLaunchFunnelMetrics } from "@/modules/launch/launch-metrics.service";
import { generateFirstUsersLaunchStrategy } from "@/modules/launch/launch-strategy.service";

export const dynamic = "force-dynamic";

/** GET /api/launch/metrics — funnel + strategy snapshot (admin only). */
export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const url = new URL(req.url);
  const days = Math.min(90, Math.max(7, parseInt(url.searchParams.get("days") ?? "30", 10) || 30));
  const [metrics, strategy] = await Promise.all([
    getLaunchFunnelMetrics(days),
    Promise.resolve(generateFirstUsersLaunchStrategy()),
  ]);
  return NextResponse.json({ ok: true, metrics, strategy });
}
