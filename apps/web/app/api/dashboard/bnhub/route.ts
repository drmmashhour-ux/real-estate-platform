import { NextResponse } from "next/server";
import { suggestBnHubPricing } from "@/lib/ai/brain";

/** BNHUB dashboard AI data only. Keeps BNHUB page light. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const aiPricing = suggestBnHubPricing("");
    return NextResponse.json(aiPricing);
  } catch (e) {
    console.error("GET /api/dashboard/bnhub:", e);
    return NextResponse.json(
      { recommendedCents: 15000, minCents: 12000, maxCents: 18000, demandLevel: "medium", factors: ["Default"] },
      { status: 200 }
    );
  }
}
