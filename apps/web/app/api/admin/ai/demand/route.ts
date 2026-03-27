import { NextRequest } from "next/server";
import { computeDemandForecast, getDemandForecasts } from "@/lib/ai-demand";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (region && searchParams.get("forecast") === "true") {
      const date = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date();
      const forecast = await computeDemandForecast({ region, forecastDate: date, store: false });
      return Response.json(forecast);
    }
    const list = await getDemandForecasts({
      region: region ?? undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: 90,
    });
    return Response.json(list);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get demand forecasts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, forecastDate, propertyType, store } = body;
    if (!region || !forecastDate) {
      return Response.json({ error: "region, forecastDate required" }, { status: 400 });
    }
    const forecast = await computeDemandForecast({
      region,
      forecastDate: new Date(forecastDate),
      propertyType,
      store: !!store,
    });
    return Response.json(forecast);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to compute demand forecast" }, { status: 500 });
  }
}
