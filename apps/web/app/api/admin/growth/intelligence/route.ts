import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { growthIntelligenceFlags } from "@/config/feature-flags";
import { getGrowthIntelligencePayload } from "@/modules/growth-intelligence/growth-admin-payload.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = await requireAdminUser(viewerId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? "en";
  const country = url.searchParams.get("country") ?? "ca";

  const bundle = await getGrowthIntelligencePayload({ locale, country });
  if (!bundle.enabled) {
    return NextResponse.json({
      disabled: true,
      flags: growthIntelligenceFlags,
      summary: null,
      signals: [],
      opportunities: [],
      priorities: [],
      regionOpportunities: [],
      funnel: { worstListings: [], notes: ["Growth Intelligence disabled or snapshot unavailable."] },
      trustLeverage: { highTrustLowExposureCount: 0, notes: [] },
      freshness: [],
    });
  }

  return NextResponse.json({
    summary: bundle.summary,
    signals: bundle.signals.slice(0, 200),
    opportunities: bundle.opportunities.slice(0, 150),
    priorities: bundle.priorities.slice(0, 150),
    regionOpportunities: bundle.regionOpportunities,
    funnel: bundle.funnel,
    trustLeverage: bundle.trustLeverage,
    trends: bundle.trends,
    timelineSignals: bundle.timelineSignals.slice(0, 120),
    flags: bundle.flags,
    freshness: bundle.availabilityNotes,
    briefsFlag: growthIntelligenceFlags.growthBriefsV1,
  });
}
