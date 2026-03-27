import { NextRequest, NextResponse } from "next/server";
import { buildMarketAnalysis } from "@/lib/market/analysis-service";

export const dynamic = "force-dynamic";

/** GET ?city=...&type=... — trend analysis & forecast (estimates only). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get("city") ?? "").trim();
  const propertyType = (searchParams.get("type") ?? "Residential").trim();

  if (!city) {
    return NextResponse.json({ error: "Missing city query parameter", label: "estimate" }, { status: 400 });
  }

  try {
    const analysis = await buildMarketAnalysis(city, propertyType || "Residential");
    return NextResponse.json(analysis);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to build market analysis", label: "estimate" },
      { status: 500 }
    );
  }
}
