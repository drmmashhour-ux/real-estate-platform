import { NextResponse } from "next/server";
import { lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { buildInvestorStoryBundle } from "@/modules/investor-story/investor-story.service";
import { buildPositioningBundle } from "@/modules/positioning/positioning.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!lecipmLaunchInvestorFlags.investorStoryV1) {
    return NextResponse.json({ error: "Investor story module disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const competitor = (searchParams.get("competitor") ?? "airbnb") as "airbnb" | "centris" | "generic_mls";
  const safe = competitor === "centris" || competitor === "generic_mls" ? competitor : "airbnb";

  const [story, positioning] = await Promise.all([
    buildInvestorStoryBundle(),
    Promise.resolve(buildPositioningBundle(safe)),
  ]);

  if (!lecipmLaunchInvestorFlags.positioningEngineV1) {
    return NextResponse.json({
      story,
      positioning: null,
      positioningDisabledReason: "FEATURE_POSITIONING_ENGINE_V1 is off",
    });
  }

  return NextResponse.json({ story, positioning });
}
