import { type NextRequest, NextResponse } from "next/server";
import { engineFlags, eventTimelineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  buildUnifiedListingReadModel,
  parseOptionalListingSource,
} from "@/modules/unified-intelligence/unified-intelligence.service";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!engineFlags.unifiedIntelligenceV1) {
    return NextResponse.json({ error: "Unified intelligence disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const listingId = req.nextUrl.searchParams.get("listingId")?.trim() ?? "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const source = parseOptionalListingSource(req.nextUrl.searchParams.get("source"));
  if (req.nextUrl.searchParams.get("source") && !source) {
    return NextResponse.json({ error: "source must be web, syria, or external" }, { status: 400 });
  }

  const regionListingKey = req.nextUrl.searchParams.get("regionListingKey")?.trim() || undefined;
  const regionCode = req.nextUrl.searchParams.get("regionCode")?.trim() || undefined;

  const intelligence = await buildUnifiedListingReadModel({
    listingId,
    source,
    regionListingKey,
    regionCode,
  });

  const freshness = new Date().toISOString();

  return NextResponse.json({
    intelligence,
    sourceStatus: intelligence.sourceStatus,
    flags: {
      unifiedIntelligenceV1: engineFlags.unifiedIntelligenceV1,
      autonomousMarketplaceV1: engineFlags.autonomousMarketplaceV1,
      eventTimelineV1: eventTimelineFlags.eventTimelineV1,
    },
    freshness,
  });
}
