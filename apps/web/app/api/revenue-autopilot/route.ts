import { NextResponse } from "next/server";
import { REVENUE_PLATFORM_SCOPE_ID } from "@/lib/revenue-autopilot/constants";
import { getRevenueOverview } from "@/lib/revenue-autopilot/get-revenue-overview";
import { requireRevenueScope } from "@/lib/revenue-autopilot/revenue-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const st = url.searchParams.get("scopeType") as "owner" | "platform" | null;
  const sid = url.searchParams.get("scopeId");

  const scopeType = st === "platform" ? "platform" : "owner";
  const gate = await requireRevenueScope({
    scopeType,
    scopeId: scopeType === "platform" ? REVENUE_PLATFORM_SCOPE_ID : sid,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const overview = await getRevenueOverview({
    scopeType: gate.scopeType,
    scopeId: gate.scopeId,
  });

  return NextResponse.json({
    ...overview,
    effectiveScope: { type: gate.scopeType, id: gate.scopeId },
    isAdmin: gate.isAdmin,
  });
}
