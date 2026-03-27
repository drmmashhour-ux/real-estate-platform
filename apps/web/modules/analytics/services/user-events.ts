import type { Prisma } from "@prisma/client";
import { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

const TRAFFIC_TO_USER_EVENT: Record<string, UserEventType | undefined> = {
  page_view: UserEventType.VISIT_PAGE,
  /** Runs only — CTA clicks stay in TrafficEvent for funnel math */
  investment_analyze_run: UserEventType.ANALYZE,
  investment_deal_saved: UserEventType.SAVE_DEAL,
  investment_compare_used: UserEventType.COMPARE,
  investment_return_visit: UserEventType.RETURN_VISIT,
  growth_waitlist_signup: UserEventType.WAITLIST_SIGNUP,
  shared_deal_page_view: UserEventType.VISIT_PAGE,
  shared_deal_analyze_click: UserEventType.ANALYZE,
  shared_deal_waitlist_email: UserEventType.WAITLIST_SIGNUP,
};

/**
 * Persist normalized product events alongside TrafficEvent (for admin insights).
 */
export async function recordUserEventFromTraffic(input: {
  eventType: string;
  path?: string | null;
  meta?: Record<string, unknown> | null;
  sessionId?: string | null;
}): Promise<void> {
  let mapped = TRAFFIC_TO_USER_EVENT[input.eventType];
  /** Legacy: same event name was used for CTA vs run — only persist ANALYZE for form runs */
  if (input.eventType === "investment_analyze_click") {
    const meta = input.meta;
    if (meta && typeof meta === "object" && "ctaKind" in meta) {
      return;
    }
    mapped = UserEventType.ANALYZE;
  }
  if (!mapped) return;

  const metadata: Record<string, unknown> = {};
  if (input.path) metadata.path = input.path;
  if (input.meta && typeof input.meta === "object") {
    Object.assign(metadata, input.meta);
  }

  try {
    await prisma.userEvent.create({
      data: {
        eventType: mapped,
        metadata: metadata as Prisma.InputJsonValue,
        sessionId: input.sessionId?.slice(0, 64) ?? null,
      },
    });
  } catch (e) {
    console.warn("[user-events] record failed", e);
  }
}
