import { NextResponse } from "next/server";
import { matchContractorsForUpgrades } from "@/modules/contractors/contractor.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/contractors/match?region=Montreal&actions=comma,separated,recommendation,text
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const region = url.searchParams.get("region");
  const actionsRaw = url.searchParams.get("actions");
  const actions = actionsRaw
    ? actionsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const result = await matchContractorsForUpgrades({
    upgradeRecommendations: actions,
    region,
    limit: 16,
  });

  return NextResponse.json({
    ...result,
    positioning: "From insight → to upgrade → to certified listing",
    monetization: {
      leadFeeNote: "Lead fee per introduction — configure with sales / billing.",
      premiumListingNote: "Premium contractor placement — configure with sales / billing.",
    },
  });
}
