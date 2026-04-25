import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getBrokerGrowthMetrics } from "@/modules/growth/broker-metrics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireAdminSession();
  if (!a.ok) {
    return NextResponse.json({ error: a.error }, { status: a.status });
  }
  const metrics = await getBrokerGrowthMetrics();
  return NextResponse.json({ ok: true, metrics });
}
