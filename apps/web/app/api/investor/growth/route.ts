import { NextResponse, type NextRequest } from "next/server";
import { requireCompanyInvestorApiAuth } from "@/lib/investor-company/api-auth";
import { getGrowthSeries } from "@/modules/investor-company/investor-company-metrics.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireCompanyInvestorApiAuth();
  if (!auth.ok) return auth.response;

  const daysRaw = request.nextUrl.searchParams.get("days");
  const days = Math.min(365, Math.max(14, Number(daysRaw ?? "90") || 90));

  const series = await getGrowthSeries(days, new Date());

  return NextResponse.json({ asOf: new Date().toISOString(), days, series }, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
