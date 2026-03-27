import { NextRequest } from "next/server";
import { computeAndStoreRankingScore, getListingRankingScore } from "@/lib/ai-ranking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    const score = await getListingRankingScore(listingId);
    return Response.json(score ?? { message: "No score yet" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get ranking score" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const listingId = body?.listingId;
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    const result = await computeAndStoreRankingScore(listingId);
    return Response.json(result ?? { error: "Listing not found" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to compute ranking score" }, { status: 500 });
  }
}
