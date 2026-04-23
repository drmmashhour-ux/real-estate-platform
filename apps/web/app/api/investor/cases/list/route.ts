import { NextResponse } from "next/server";
import { listInvestorAnalysisCases } from "@/lib/investor/service";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";

export async function GET() {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  const items = await listInvestorAnalysisCases(ctx.owner.ownerType, ctx.owner.ownerId);
  return NextResponse.json({ success: true, items });
}
