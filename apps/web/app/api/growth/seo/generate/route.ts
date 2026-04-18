import { NextResponse } from "next/server";
import { buildListingSeoSuggestion } from "@/modules/demand-acquisition/seo-engine.service";
import { requireMontrealGrowthAdmin } from "@/lib/growth/montreal-growth-api-auth";
import { montrealGrowthEngineFlags } from "@/config/feature-flags";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

type Body = { listingId?: string };

export async function POST(request: Request) {
  const auth = await requireMontrealGrowthAdmin();
  if (!auth.ok) return auth.response;
  if (!montrealGrowthEngineFlags.demandAcquisitionV1) {
    return NextResponse.json({ error: "Demand acquisition module disabled" }, { status: 403 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const suggestion = await buildListingSeoSuggestion(listingId);
  if (!suggestion) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "seo_listing_draft_generated",
    payload: { listingId, reviewRequired: true },
  });

  return NextResponse.json({ suggestion });
}
