import { NextRequest } from "next/server";
import { getRankingWeights, setRankingWeights } from "@/lib/bnhub/search-ranking";

/**
 * GET: return current ranking weights (admin or internal).
 * POST: update weights (admin only; add auth in production).
 */
export async function GET() {
  try {
    const weights = await getRankingWeights();
    return Response.json(weights);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get ranking config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Body must be object of key -> weight" }, { status: 400 });
    }
    const weights: Record<string, number> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "number") weights[k] = v;
    }
    await setRankingWeights(weights);
    return Response.json(await getRankingWeights());
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update ranking config" }, { status: 500 });
  }
}
