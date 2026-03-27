import type { PrismaClient, Prisma } from "@prisma/client";
import type { ConversionTrigger } from "../domain/types";

function messageForTrigger(trigger: ConversionTrigger) {
  switch (trigger) {
    case "post_signup_welcome":
      return {
        title: "Welcome to LECIPM",
        body: "Start with one property analysis to unlock your first high-confidence decision.",
      };
    case "first_analysis_follow_up":
      return {
        title: "Great first analysis",
        body: "Create your first lead now and let automation handle follow-up timing.",
      };
    case "analysis_threshold":
      return {
        title: "You unlocked advanced insights",
        body: "You have run multiple analyses. Upgrade to compare scenarios and close deals faster.",
      };
    case "high_value_view":
      return {
        title: "High-value opportunity detected",
        body: "This listing has a strong profile. Reach out now before demand increases.",
      };
    case "repeat_listing_interest":
      return {
        title: "You keep coming back to this listing",
        body: "Create a lead and start guided follow-up to move this deal forward.",
      };
    case "inactive_reactivation":
      return {
        title: "New deal signals are available",
        body: "Return to LECIPM to review updated trust and market insights.",
      };
  }
}

export async function enqueueFollowUps(
  db: PrismaClient,
  args: { userId: string; triggers: ConversionTrigger[]; listingId?: string | null }
) {
  if (!args.triggers.length) return [];
  const since = new Date(Date.now() - 18 * 60 * 60 * 1000);
  const out: string[] = [];

  for (const trigger of args.triggers) {
    const already = await db.conversionAutomationLog.findFirst({
      where: { userId: args.userId, triggerType: trigger, createdAt: { gte: since } },
      select: { id: true },
    });
    if (already) continue;
    const msg = messageForTrigger(trigger);
    await db.conversionAutomationLog.create({
      data: {
        userId: args.userId,
        triggerType: trigger,
        channel: "in_app",
        status: "queued",
        payload: { listingId: args.listingId ?? null, ...msg } as Prisma.InputJsonValue,
      },
    });
    out.push(trigger);
  }
  return out;
}
