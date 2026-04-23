import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { listInvestmentOpportunitiesForDashboard } from "@/modules/investment/investment-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const riskRaw = url.searchParams.get("riskLevels");
  const riskLevels =
    riskRaw ?
      riskRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const minScore = url.searchParams.get("minScore");
  const maxScore = url.searchParams.get("maxScore");
  const take = Number(url.searchParams.get("take") ?? "200") || 200;

  try {
    const opportunities = await listInvestmentOpportunitiesForDashboard({
      riskLevels,
      minScore: minScore != null && minScore !== "" ? Number(minScore) : undefined,
      maxScore: maxScore != null && maxScore !== "" ? Number(maxScore) : undefined,
      take,
    });
    return NextResponse.json({
      opportunities,
      explainability: {
        dataSources: ["CRM listing snapshot → investment_opportunities"],
        advisoryOnly: true,
      },
    });
  } catch (e) {
    console.error("[autonomous-brain/opportunities]", e);
    return NextResponse.json({ error: "opportunities_failed" }, { status: 500 });
  }
}
