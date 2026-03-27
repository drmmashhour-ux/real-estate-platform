import { NextRequest } from "next/server";
import { isAiManagerEnabled, callAiManager } from "@/lib/ai-manager-client";
import { computeDemandForecast } from "@/lib/ai-demand";

export const dynamic = "force-dynamic";

/** POST /api/ai/demand-forecast – high/low demand periods. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, propertyType, fromDate, toDate, searchVolumeTrend, bookingHistoryCount } = body;
    if (!region || typeof region !== "string") {
      return Response.json({ error: "region required" }, { status: 400 });
    }

    if (isAiManagerEnabled()) {
      const result = await callAiManager<{
        highDemandPeriods: { start: string; end: string; level: number }[];
        lowDemandPeriods: { start: string; end: string; level: number }[];
        demandLevel: string;
        summary: string;
      }>("/v1/ai-manager/demand-forecast", body);
      return Response.json(result);
    }

    const from = fromDate ? new Date(fromDate) : new Date();
    const to = toDate
      ? new Date(toDate)
      : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000);
    const forecast = await computeDemandForecast({
      region,
      forecastDate: from,
      propertyType,
      store: false,
    });
    const highDemandPeriods: { start: string; end: string; level: number }[] = [];
    const lowDemandPeriods: { start: string; end: string; level: number }[] = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 7)) {
      const start = d.toISOString().slice(0, 10);
      const end = new Date(d.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (d.getMonth() >= 5 && d.getMonth() <= 8) {
        highDemandPeriods.push({ start, end, level: 0.8 });
      } else if (d.getMonth() <= 2 && d.getDay() >= 1 && d.getDay() <= 4) {
        lowDemandPeriods.push({ start, end, level: 0.3 });
      }
    }
    const demandLevel =
      forecast.demandLevel >= 0.6 ? "high" : forecast.demandLevel >= 0.35 ? "medium" : "low";
    return Response.json({
      highDemandPeriods: highDemandPeriods.slice(0, 8),
      lowDemandPeriods: lowDemandPeriods.slice(0, 8),
      demandLevel,
      summary: `Demand in ${region}: ${demandLevel}.`,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to get demand forecast" },
      { status: 500 }
    );
  }
}
