import { NextRequest } from "next/server";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";

/** GET /api/bnhub/listings/:id/smart-price */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await generateSmartPrice(id);
    return Response.json({
      recommended_price_cents: result.recommendedPriceCents,
      confidence: result.confidence,
      confidence_score: result.confidenceScore,
      market_avg_cents: result.marketAvgCents,
      demand_level: result.demandLevel,
      factors: result.factors,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Not found" },
      { status: 404 }
    );
  }
}
