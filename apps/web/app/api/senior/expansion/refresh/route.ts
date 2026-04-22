import { NextResponse } from "next/server";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { refreshAllSeniorCities, refreshSeniorCityMetrics } from "@/modules/senior-living/expansion/senior-city-readiness.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;

  let cityId: string | undefined;
  try {
    const body = (await request.json()) as { cityId?: string };
    cityId = typeof body.cityId === "string" ? body.cityId : undefined;
  } catch {
    cityId = undefined;
  }

  logSeniorCommand("[senior-expansion]", "refresh_metrics", {
    userId: auth.ctx.userId.slice(0, 8),
    cityId: cityId?.slice(0, 8),
  });

  if (cityId) {
    await refreshSeniorCityMetrics(cityId);
    return NextResponse.json({ ok: true, scope: "city" as const });
  }

  const n = await refreshAllSeniorCities();
  return NextResponse.json({ ok: true, scope: "all" as const, citiesUpdated: n });
}
