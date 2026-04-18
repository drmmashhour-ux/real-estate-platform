import { subHours } from "date-fns";
import { prisma } from "@/lib/db";

const AUDIT_EVENT = "growth_engine_v1:audit";

function countMatchingAudit(
  rows: { properties: unknown }[],
  action: string
): number {
  return rows.filter((e) => {
    const p = e.properties as Record<string, unknown> | null;
    return p?.action === action;
  }).length;
}

/** Max outreach draft generations per admin per rolling hour (reviewable; not auto-send). */
export async function assertOutreachDraftRateLimit(actorUserId: string): Promise<Response | null> {
  const since = subHours(new Date(), 1);
  const events = await prisma.growthFunnelEvent.findMany({
    where: {
      userId: actorUserId,
      createdAt: { gte: since },
      eventName: AUDIT_EVENT,
    },
    select: { properties: true },
    take: 300,
  });
  if (countMatchingAudit(events, "supply_outreach_draft_generated") >= 50) {
    return Response.json(
      { error: "Rate limit: too many outreach draft requests this hour. Try again later." },
      { status: 429 }
    );
  }
  return null;
}

/** Max referral code creations per admin per rolling hour (abuse guard). */
export async function assertReferralCreateRateLimit(actorUserId: string): Promise<Response | null> {
  const since = subHours(new Date(), 1);
  const events = await prisma.growthFunnelEvent.findMany({
    where: {
      userId: actorUserId,
      createdAt: { gte: since },
      eventName: AUDIT_EVENT,
    },
    select: { properties: true },
    take: 300,
  });
  if (countMatchingAudit(events, "growth_referral_code_created") >= 30) {
    return Response.json(
      { error: "Rate limit: too many referral creations this hour." },
      { status: 429 }
    );
  }
  return null;
}
