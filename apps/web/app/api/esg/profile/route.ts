import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { buildEsgRecommendations, computeEsgScore } from "@/modules/esg/esg-score.engine";
import type { EsgProfilePayload } from "@/modules/esg/esg.types";
import { getEsgDashboardBundle, upsertEsgProfile, userCanManageListingListing } from "@/modules/esg/esg.service";
import {
  captureRetrofitUpstreamFingerprint,
  scheduleDebouncedRetrofitUpstreamRefresh,
} from "@/modules/esg/esg-retrofit-upstream-refresh";
import { logInfo } from "@/lib/logger";
import { isLecipmPhaseEnabled, logRolloutGate, withRolloutDisabledBody } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

const TAG = "[esg]";

function toPayload(row: {
  energyScore: number | null;
  carbonScore: number | null;
  sustainabilityScore: number | null;
  certification: string | null;
  solar: boolean;
  renovation: boolean;
  highCarbonMaterials: boolean;
}): EsgProfilePayload {
  return {
    energyScore: row.energyScore,
    carbonScore: row.carbonScore,
    sustainabilityScore: row.sustainabilityScore,
    certification: row.certification,
    solar: row.solar,
    renovation: row.renovation,
    highCarbonMaterials: row.highCarbonMaterials,
  };
}

/** GET — profile + computed engine + recommendations */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await userCanManageListingListing(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isLecipmPhaseEnabled(1)) {
    logRolloutGate(1, "/api/esg/profile GET");
    return NextResponse.json(
      withRolloutDisabledBody(1, {
        listingId,
        profile: null,
        engine: null,
        recommendations: [],
        events: [],
      })
    );
  }

  const bundle = await getEsgDashboardBundle(listingId);
  if (!bundle) {
    return NextResponse.json({ listingId, profile: null, engine: null, recommendations: [], events: [] });
  }

  logInfo(`${TAG} profile.get`, { listingId });
  return NextResponse.json({
    listingId,
    profile: bundle.profile,
    engine: bundle.engine,
    recommendations: bundle.recommendations,
    events: bundle.events,
  });
}

/** PATCH — upsert metrics + flags */
export async function PATCH(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    listingId?: string;
    energyScore?: number | null;
    carbonScore?: number | null;
    sustainabilityScore?: number | null;
    certification?: string | null;
    solar?: boolean;
    renovation?: boolean;
    highCarbonMaterials?: boolean;
  };

  if (!body.listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await userCanManageListingListing(userId, body.listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isLecipmPhaseEnabled(1)) {
    logRolloutGate(1, "/api/esg/profile PATCH");
    return NextResponse.json(
      withRolloutDisabledBody(1, {
        skipped: true as const,
        profile: null,
        engine: null,
        recommendations: [],
      })
    );
  }

  const fpBefore = await captureRetrofitUpstreamFingerprint(body.listingId);

  await upsertEsgProfile(body.listingId, {
    ...(body.energyScore !== undefined ? { energyScore: body.energyScore } : {}),
    ...(body.carbonScore !== undefined ? { carbonScore: body.carbonScore } : {}),
    ...(body.sustainabilityScore !== undefined ? { sustainabilityScore: body.sustainabilityScore } : {}),
    ...(body.certification !== undefined ? { certification: body.certification } : {}),
    ...(body.solar !== undefined ? { solar: body.solar } : {}),
    ...(body.renovation !== undefined ? { renovation: body.renovation } : {}),
    ...(body.highCarbonMaterials !== undefined ? { highCarbonMaterials: body.highCarbonMaterials } : {}),
  });

  const row = await prisma.esgProfile.findUnique({ where: { listingId: body.listingId } });
  if (!row) return NextResponse.json({ error: "Upsert failed" }, { status: 500 });

  const engine = computeEsgScore(toPayload(row));
  const recommendations = buildEsgRecommendations(toPayload(row), engine.flags);

  logInfo(`${TAG} profile.patch`, { listingId: body.listingId });

  scheduleDebouncedRetrofitUpstreamRefresh(body.listingId, "evidence", fpBefore);

  return NextResponse.json({
    profile: row,
    engine,
    recommendations,
  });
}
