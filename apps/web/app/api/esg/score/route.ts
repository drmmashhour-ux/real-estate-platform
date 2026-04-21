import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeEsgScore } from "@/modules/esg/esg-score.engine";
import type { EsgProfilePayload } from "@/modules/esg/esg.types";
import { syncEsgScoreForListing } from "@/modules/esg/esg.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[esg-score]";

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

/** GET — latest composite score + grade (persists cache). Public when listing exists. */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const profile = await prisma.esgProfile.findUnique({ where: { listingId } });
  if (!profile) {
    return NextResponse.json({ error: "No ESG profile for this listing" }, { status: 404 });
  }

  await syncEsgScoreForListing(listingId);
  const fresh = await prisma.esgProfile.findUnique({ where: { listingId } });
  if (!fresh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const engine = computeEsgScore(toPayload(fresh));
  logInfo(`${TAG} get`, { listingId, score: engine.score });

  return NextResponse.json({
    listingId,
    score: engine.score,
    grade: engine.grade,
    flags: engine.flags,
    cachedComposite: fresh.compositeScore,
    cachedGrade: fresh.grade,
  });
}
