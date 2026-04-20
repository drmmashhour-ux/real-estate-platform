import { NextResponse } from "next/server";
import { trustFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import type { TrustScore } from "@/modules/trust/trust.types";
import { loadTrustPayloadForSessionUser } from "@/modules/trust/trust-session.service";
import { getTrustUpgradeOpportunities } from "@/modules/trust/trust-monetization.service";

export const dynamic = "force-dynamic";

/** GET — deterministic trust snapshot for the signed-in user (no sensitive payloads). */
export async function GET(req: Request) {
  if (!trustFlags.trustScoringV1 && !trustFlags.trustBadgesV1) {
    return NextResponse.json({ error: "Trust scoring is disabled" }, { status: 403 });
  }

  const userId = await getGuestId().catch(() => null);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale")?.trim() || "en";
  const country = url.searchParams.get("country")?.trim() || "ca";
  const actor = url.searchParams.get("actor")?.trim() || undefined;

  const payload = await loadTrustPayloadForSessionUser({
    userId,
    locale,
    country,
    actorHint: actor ?? null,
  });

  if (!payload) {
    return NextResponse.json(
      {
        trustScore: null,
        badges: [],
        visibilityImpact: null,
        factors: [],
        upgradeOpportunities: [],
      },
      { status: 200 },
    );
  }

  const ts: TrustScore = {
    score: payload.score,
    level: payload.level,
    confidence: payload.confidence,
    factors: payload.factors,
  };
  const upgradeOpportunities = getTrustUpgradeOpportunities(ts);

  return NextResponse.json({
    trustScore: {
      score: payload.score,
      level: payload.level,
      confidence: payload.confidence,
      factors: payload.factors,
    },
    badges: payload.badges,
    visibilityImpact: payload.visibility,
    factors: payload.factors,
    upgradeOpportunities,
  });
}
