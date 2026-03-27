import type { PrismaClient, Prisma } from "@prisma/client";
import type { ConversionStage, ConversionTrackEvent, ConversionTrigger } from "../domain/types";

function stageFromEvent(event: ConversionTrackEvent): ConversionStage {
  if (event === "signup") return "signup";
  if (event === "analysis_run" || event === "high_score_view" || event === "repeat_listing_click") return "analysis";
  if (event === "lead_created") return "lead";
  if (event === "lead_purchased") return "paid";
  return "visitor";
}

export async function trackConversionEvent(
  db: PrismaClient,
  input: {
    userId: string;
    event: ConversionTrackEvent;
    listingId?: string | null;
    dealScore?: number | null;
    trustScore?: number | null;
    timeSpentSec?: number | null;
  }
) {
  const profile = await db.conversionProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      stage: stageFromEvent(input.event),
      analysesCount: input.event === "analysis_run" ? 1 : 0,
      highScoreViews: input.event === "high_score_view" ? 1 : 0,
      repeatListingView: input.event === "repeat_listing_click" ? 1 : 0,
      engagementLevel: Math.max(1, Math.round((input.timeSpentSec ?? 20) / 30)),
      metadata: { lastListingId: input.listingId ?? null } as Prisma.InputJsonValue,
    },
    update: {
      stage: stageFromEvent(input.event),
      analysesCount: { increment: input.event === "analysis_run" ? 1 : 0 },
      highScoreViews: { increment: input.event === "high_score_view" ? 1 : 0 },
      repeatListingView: { increment: input.event === "repeat_listing_click" ? 1 : 0 },
      engagementLevel: { increment: Math.max(1, Math.round((input.timeSpentSec ?? 20) / 90)) },
      lastActiveAt: new Date(),
      metadata: { lastListingId: input.listingId ?? null, dealScore: input.dealScore ?? null, trustScore: input.trustScore ?? null } as Prisma.InputJsonValue,
    },
  });

  const triggers: ConversionTrigger[] = [];
  if (input.event === "signup") triggers.push("post_signup_welcome");
  if (input.event === "analysis_run" && profile.analysesCount + 1 === 1) triggers.push("first_analysis_follow_up");
  if (profile.analysesCount + (input.event === "analysis_run" ? 1 : 0) >= 3) triggers.push("analysis_threshold");
  if (input.event === "high_score_view" || (input.dealScore ?? 0) >= 75) triggers.push("high_value_view");
  if (profile.repeatListingView + (input.event === "repeat_listing_click" ? 1 : 0) >= 3) triggers.push("repeat_listing_interest");
  if (input.event === "inactive_ping") triggers.push("inactive_reactivation");

  return { profile, triggers };
}
