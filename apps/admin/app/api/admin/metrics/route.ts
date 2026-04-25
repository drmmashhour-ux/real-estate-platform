import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getCoreMetricsBundle, rangeFromDays } from "@/modules/metrics/metrics.service";
import { parseSegmentFromSearchParams } from "@/modules/metrics/segmentation.service";
import { assertCommandCenterEnabled } from "@/modules/command-center/command-center.gate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const gate = assertCommandCenterEnabled("command");
  if (!gate.ok) return NextResponse.json({ error: gate.code }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const days = Math.min(90, Math.max(7, parseInt(sp.get("days") ?? "30", 10) || 30));
  const from = sp.get("from");
  const to = sp.get("to");
  let bundle;
  if (from && to) {
    bundle = await getCoreMetricsBundle({
      from: new Date(from),
      toExclusive: new Date(to),
      segment: parseSegmentFromSearchParams(sp),
    });
  } else {
    const r = rangeFromDays(days);
    bundle = await getCoreMetricsBundle({ ...r, segment: parseSegmentFromSearchParams(sp) });
  }
  return NextResponse.json({ metrics: bundle });
}
