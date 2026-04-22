import { NextResponse, type NextRequest } from "next/server";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { loadExpansionOverview } from "@/modules/senior-living/expansion/senior-expansion-playbook.service";
import { refreshAllSeniorCities, refreshSeniorCityMetrics } from "@/modules/senior-living/expansion/senior-city-readiness.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const country = url.searchParams.get("country") ?? undefined;
  const refresh = url.searchParams.get("refresh") === "1";
  const cityId = url.searchParams.get("cityId");

  logSeniorCommand("[senior-expansion]", "overview", {
    userId: auth.ctx.userId.slice(0, 8),
    refresh,
    country,
  });

  if (refresh) {
    if (cityId) {
      await refreshSeniorCityMetrics(cityId);
    } else {
      await refreshAllSeniorCities();
    }
  }

  const data = await loadExpansionOverview({ country });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=10" },
  });
}
