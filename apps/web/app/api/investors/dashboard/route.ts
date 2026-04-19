import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildInvestorDashboard } from "@/modules/investors/investor-dashboard.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.investorDashboardV1) {
    return NextResponse.json({ error: "Investor dashboard disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const windowDays = Math.min(45, Math.max(7, Number(url.searchParams.get("windowDays")) || 14));

  const dashboard = await buildInvestorDashboard(windowDays);

  return NextResponse.json({
    dashboard,
    disclaimer:
      "Internal advisory snapshot — correlational CRM and growth telemetry only. Not audited financials, not an offer, not investment advice.",
  });
}
