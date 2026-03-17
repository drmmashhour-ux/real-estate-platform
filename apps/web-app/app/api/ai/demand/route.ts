import { NextRequest } from "next/server";
import { computeDemandForecast } from "@/lib/ai-demand";

export const dynamic = "force-dynamic";

/** POST /api/ai/demand – demand level and high/low demand dates for a region. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, propertyType, fromDate, toDate } = body;
    if (!region || typeof region !== "string") {
      return Response.json({ error: "region required" }, { status: 400 });
    }
    const from = fromDate ? new Date(fromDate) : new Date();
    const to = toDate ? new Date(toDate) : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000);
    const highDemandDates: string[] = [];
    const lowDemandDates: string[] = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const month = d.getMonth();
      const iso = d.toISOString().slice(0, 10);
      if ((month >= 5 && month <= 8) || day === 5 || day === 6) {
        highDemandDates.push(iso);
      } else if (month >= 0 && month <= 2 && day >= 1 && day <= 4) {
        lowDemandDates.push(iso);
      }
    }
    const forecast = await computeDemandForecast({
      region,
      forecastDate: from,
      propertyType: typeof propertyType === "string" ? propertyType : undefined,
      store: false,
    });
    const demandLevel =
      forecast.demandLevel >= 0.6 ? "high" : forecast.demandLevel >= 0.35 ? "medium" : "low";
    return Response.json({
      demandLevel,
      highDemandDates: highDemandDates.slice(0, 14),
      lowDemandDates: lowDemandDates.slice(0, 14),
      searchVolumeTrend: "stable" as const,
      bookingFrequencyTrend: "stable" as const,
      region: forecast.region,
      forecastDate: forecast.forecastDate,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to get demand forecast" },
      { status: 500 }
    );
  }
}
