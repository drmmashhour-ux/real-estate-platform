import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPersonalizedRecommendations, parseBoolParam } from "@/modules/personalized-recommendations";

export const dynamic = "force-dynamic";

/** Deals + pipeline + opportunities (broker/investor modes). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get("limit") ?? "12", 10) || 12, 48);
  const personalization = parseBoolParam(sp.get("personalization"), true);
  const mode = sp.get("mode")?.toUpperCase() === "INVESTOR" ? "INVESTOR" : "BROKER";

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in required", items: [] },
      { status: 401 },
    );
  }

  const result = await getPersonalizedRecommendations({
    userId,
    mode,
    limit,
    personalization,
  });

  const items = result.items.map(({ factorsInternal: _f, ...rest }) => rest);

  return NextResponse.json({
    items,
    mode: result.mode,
    personalizationApplied: result.personalizationApplied,
    privacyNote: result.privacyNote,
  });
}
