import { NextRequest } from "next/server";
import { getActiveMarkets, upsertMarket } from "@/lib/market-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const markets = await getActiveMarkets();
    return Response.json(markets);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch markets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, name, country, currency, defaultLanguage, active } = body;
    if (!code || !name || !country) {
      return Response.json({ error: "code, name, country required" }, { status: 400 });
    }
    const market = await upsertMarket({
      id,
      code,
      name,
      country,
      currency,
      defaultLanguage,
      active,
    });
    return Response.json(market);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to upsert market" }, { status: 500 });
  }
}
