import { NextResponse } from "next/server";
import { z } from "zod";
import { rebuildNeighborhoodProfile } from "@/lib/neighborhood/aggregate";
import { generateNeighborhoodSummary } from "@/lib/neighborhood/ai-summary";
import { rebuildInvestmentZoneSnapshots } from "@/lib/neighborhood/zones";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  city: z.string().min(1),
  neighborhoodName: z.string().min(1),
  province: z.string().max(8).optional(),
  trendChangeRatio: z.number().min(-1).max(1).optional(),
  skipAi: z.boolean().optional(),
  skipZoneSnapshots: z.boolean().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

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

  const province = parsed.data.province ?? "QC";
  const trend = parsed.data.trendChangeRatio ?? 0.04;

  const profile = await rebuildNeighborhoodProfile(
    parsed.data.city,
    parsed.data.neighborhoodName,
    province,
    trend,
  );

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "NEIGHBORHOOD_PROFILE_REBUILT",
    payload: {
      neighborhoodProfileId: profile.id,
      neighborhoodKey: profile.neighborhoodKey,
      city: profile.city,
    },
  });

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "NEIGHBORHOOD_SCORE_RUN_CREATED",
    payload: { neighborhoodProfileId: profile.id },
  });

  let updated = profile;
  if (!parsed.data.skipAi) {
    try {
      updated = await generateNeighborhoodSummary(profile.id, ctx.userId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI_FAILED";
      await recordAuditEvent({
        actorUserId: ctx.userId,
        action: "NEIGHBORHOOD_AI_SUMMARY_SKIPPED",
        payload: { neighborhoodProfileId: profile.id, reason: msg },
      });
    }
  }

  if (!parsed.data.skipZoneSnapshots) {
    await rebuildInvestmentZoneSnapshots(parsed.data.city, province);
    await recordAuditEvent({
      actorUserId: ctx.userId,
      action: "INVESTMENT_ZONE_SNAPSHOTS_REFRESHED",
      payload: { city: parsed.data.city, province },
    });
  }

  return NextResponse.json({ success: true, profile: updated });
}
