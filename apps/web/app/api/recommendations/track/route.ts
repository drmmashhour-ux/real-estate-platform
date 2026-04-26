import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { MarketplaceMemoryRole } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recordRecommendationEngagement } from "@/modules/personalized-recommendations";
import type { RecommendationTrackEvent } from "@/modules/personalized-recommendations/recommendation.types";
import { recordRecommendationAudit } from "@/modules/personalized-recommendations/recommendation-audit.service";
import { RECOMMENDATION_TRACK_EVENTS } from "@/modules/personalized-recommendations/recommendation.types";

export const dynamic = "force-dynamic";

const allowedEvents = new Set<string>(RECOMMENDATION_TRACK_EVENTS);

const bodySchema = z.object({
  mode: z.string().max(24).optional(),
  eventKind: z.string().max(48).refine((s) => allowedEvents.has(s), "invalid eventKind"),
  entityType: z.string().max(32).optional(),
  entityId: z.string().max(64).optional(),
  recommendationScore: z.number().optional(),
  explanationUserSafe: z.string().max(2000).optional(),
  factorsJson: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(96).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  personalizationOptOut: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const b = parsed.data;

  if (b.personalizationOptOut === true) {
    await prisma.userMemoryProfile.upsert({
      where: { userId },
      create: {
        userId,
        role: MarketplaceMemoryRole.BUYER,
        personalizationEnabled: false,
        intentSummaryJson: {},
        preferenceSummaryJson: {},
        behaviorSummaryJson: {},
      },
      update: { personalizationEnabled: false },
    });
    await recordRecommendationAudit({
      userId,
      kind: "audit:opt_out",
      metadata: { source: "recommendations_track" },
    });
    return NextResponse.json({ ok: true, personalizationEnabled: false });
  }

  const r = await recordRecommendationEngagement({
    userId,
    mode: b.mode ?? "BUYER",
    eventKind: b.eventKind as RecommendationTrackEvent,
    entityType: b.entityType,
    entityId: b.entityId,
    recommendationScore: b.recommendationScore,
    explanationUserSafe: b.explanationUserSafe,
    factorsJson: b.factorsJson,
    sessionId: b.sessionId,
    metadata: b.metadata,
  });

  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }

  if (b.eventKind === "clicked") {
    await recordRecommendationAudit({
      userId,
      kind: "audit:clicked",
      mode: b.mode,
      metadata: { entityType: b.entityType, entityId: b.entityId },
    }).catch(() => null);
  }

  if (b.eventKind === "booked" || b.eventKind === "invested" || b.eventKind === "offered") {
    await recordRecommendationAudit({
      userId,
      kind: "audit:converted",
      mode: b.mode,
      metadata: { eventKind: b.eventKind, entityId: b.entityId },
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
