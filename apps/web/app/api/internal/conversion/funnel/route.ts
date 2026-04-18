import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getEventLogConversionRollup } from "@/src/modules/conversion/conversion-metrics.service";
import { listFunnelStepCounts } from "@/src/modules/conversion/funnel.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const u = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(u.searchParams.get("days") ?? "14")));
  const since = new Date(Date.now() - days * 86400000);

  const [rollup, listingFunnel, bnhubFunnel, hostFunnel] = await Promise.all([
    getEventLogConversionRollup(since),
    listFunnelStepCounts(since, "listing"),
    listFunnelStepCounts(since, "bnhub"),
    listFunnelStepCounts(since, "host"),
  ]);

  return NextResponse.json({ ok: true, since: since.toISOString(), rollup, listingFunnel, bnhubFunnel, hostFunnel });
}
