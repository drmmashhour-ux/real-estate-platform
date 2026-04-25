import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { growthIntelligenceFlags } from "@/config/feature-flags";
import {
  buildCtaImprovementBrief,
  buildProgrammaticLandingBrief,
  buildSeoContentBrief,
} from "@/modules/growth-intelligence/growth-content-brief.service";
import { getGrowthIntelligencePayload } from "@/modules/growth-intelligence/growth-admin-payload.service";
import { listRecentGrowthBriefs } from "@/modules/growth-intelligence/growth-repository";
import type { GrowthOpportunity } from "@/modules/growth-intelligence/growth.types";

export const dynamic = "force-dynamic";

function briefForOpportunity(o: GrowthOpportunity) {
  switch (o.opportunityType) {
    case "create_programmatic_page_brief":
      return buildProgrammaticLandingBrief(o);
    case "improve_cta":
      return buildCtaImprovementBrief(o);
    default:
      return buildSeoContentBrief(o);
  }
}

export async function GET(request: Request) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = await requireAdminUser(viewerId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? "en";
  const country = url.searchParams.get("country") ?? "ca";

  const persisted = await listRecentGrowthBriefs(40);

  const bundle = await getGrowthIntelligencePayload({ locale, country });
  const generated: Array<{ opportunityId: string; brief: ReturnType<typeof buildSeoContentBrief>; source: "generated" }> =
    [];

  if (
    bundle.enabled &&
    growthIntelligenceFlags.growthBriefsV1 &&
    growthIntelligenceFlags.growthIntelligenceV1
  ) {
    for (const o of bundle.opportunities.slice(0, 15)) {
      generated.push({
        opportunityId: o.id,
        brief: briefForOpportunity(o),
        source: "generated",
      });
    }
  }

  return NextResponse.json({
    briefs: {
      persisted: persisted.map((p) => ({ id: p.id, brief: p.brief, createdAt: p.createdAt.toISOString() })),
      generated,
    },
    counts: {
      persisted: persisted.length,
      generated: generated.length,
    },
    flags: growthIntelligenceFlags,
    freshness: bundle.enabled ? bundle.availabilityNotes : [],
  });
}
