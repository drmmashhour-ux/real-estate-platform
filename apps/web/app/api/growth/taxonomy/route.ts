import { NextResponse } from "next/server";
import { loadTaxonomyRotationContext } from "@/src/modules/growth-automation/application/taxonomyContext";
import {
  CHANNEL_CONTENT_NOTES,
  CHANNEL_PILLAR_STRATEGY,
  CONTENT_PILLARS,
} from "@/src/modules/growth-automation/domain/contentTaxonomy";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const planDate = searchParams.get("planDate") ?? new Date().toISOString().slice(0, 10);
  const planDay = new Date(`${planDate}T12:00:00.000Z`);
  const since = new Date(planDay);
  since.setUTCDate(since.getUTCDate() - 7);

  const rotation = await loadTaxonomyRotationContext(since);

  return NextResponse.json({
    pillars: CONTENT_PILLARS,
    channelPillarStrategy: CHANNEL_PILLAR_STRATEGY,
    channelNotes: CHANNEL_CONTENT_NOTES,
    rotationLast7Days: rotation.countsLast7Days,
    lastPillar: rotation.lastPillar,
  });
}
