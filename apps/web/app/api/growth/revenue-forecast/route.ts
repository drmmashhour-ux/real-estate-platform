import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildRevenueForecast } from "@/modules/growth/revenue-forecast.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.revenueForecastV1) {
    return NextResponse.json({ error: "Revenue forecast disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const windowDays = Math.min(45, Math.max(7, Number(url.searchParams.get("windowDays")) || 14));

  const forecast = await buildRevenueForecast(windowDays);

  return NextResponse.json({
    forecast,
    disclaimer:
      "Illustrative forecast using CRM stages — not GAAP revenue, not cash timing, not a commitment. Internal use only.",
  });
}
