import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { trackConversionEvent } from "@/modules/conversion-engine/application/conversionTriggerService";
import { runFollowUpAutomation } from "@/modules/conversion-engine/application/followUpAutomationService";
import { buildAiNudges } from "@/modules/conversion-engine/application/aiNudgeService";
import type { ConversionTrackEvent } from "@/modules/conversion-engine/domain/types";
import { recalculateLeadLecipmScores } from "@/modules/crm/application/recalculateLeadLecipmScores";
import { generateActions } from "@/src/modules/ai-operator/application/generateActions";
import { persistGeneratedActions } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";

export const dynamic = "force-dynamic";

const ALLOWED: ConversionTrackEvent[] = [
  "signup",
  "analysis_run",
  "high_score_view",
  "repeat_listing_click",
  "lead_created",
  "lead_purchased",
  "inactive_ping",
];

export async function POST(req: Request) {
  const userId = await getGuestId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const event = body?.event as ConversionTrackEvent;
  if (!ALLOWED.includes(event)) {
    return NextResponse.json({ error: "Invalid conversion event" }, { status: 400 });
  }

  const listingId = typeof body?.listingId === "string" ? body.listingId : null;
  const dealScore = typeof body?.dealScore === "number" ? body.dealScore : null;
  const trustScore = typeof body?.trustScore === "number" ? body.trustScore : null;
  const timeSpentSec = typeof body?.timeSpentSec === "number" ? body.timeSpentSec : null;
  const repeatClicks = typeof body?.repeatClicks === "number" ? body.repeatClicks : null;
  const leadId = typeof body?.leadId === "string" ? body.leadId : null;

  const tracked = await trackConversionEvent(prisma, {
    userId,
    event,
    listingId,
    dealScore,
    trustScore,
    timeSpentSec,
  });
  const queuedTriggers = await runFollowUpAutomation(prisma, {
    userId,
    triggers: tracked.triggers,
    listingId,
  });
  const nudges = buildAiNudges({ dealScore, trustScore, timeSpentSec, repeatClicks });

  if (leadId) {
    await prisma.lead
      .update({
        where: { id: leadId },
        data: {
          highIntent: event === "repeat_listing_click" || event === "high_score_view" ? true : undefined,
          engagementScore: { increment: Math.max(1, Math.round((timeSpentSec ?? 30) / 45)) },
        },
      })
      .catch(() => {});
    await recalculateLeadLecipmScores(prisma, leadId).catch(() => {});
  }

  await prisma.trafficEvent
    .create({
      data: {
        eventType: "conversion_track",
        path: "/api/conversion/track",
        source: "conversion-engine",
        medium: "product",
        meta: { event, listingId, triggers: tracked.triggers } as object,
      },
    })
    .catch(() => {});

  if (event === "analysis_run") {
    const snap: Record<string, unknown> = {};
    if (dealScore != null) snap.dealScore = dealScore;
    if (trustScore != null) snap.trustScore = trustScore;
    if (listingId) snap.listingId = listingId;
    void persistGeneratedActions(userId, generateActions("deal_analysis", snap)).catch(() => {});
  }
  if (event === "lead_created" && leadId) {
    void persistGeneratedActions(userId, generateActions("lead_management", { leadId })).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    stage: tracked.profile.stage,
    triggers: tracked.triggers,
    queuedTriggers,
    nudges,
  });
}
