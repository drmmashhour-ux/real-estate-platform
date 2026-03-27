import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLeadAttributionFromRequest } from "@/lib/attribution/lead-attribution";
import { recordUserEventFromTraffic } from "@/modules/analytics/services/user-events";

type CookieHeaderSource = { get(name: string): string | null };

export async function recordTrafficEventServer(input: {
  eventType: string;
  path?: string | null;
  meta?: Record<string, unknown> | null;
  sessionId?: string | null;
  headers: CookieHeaderSource;
  body?: unknown;
}): Promise<void> {
  const attr = getLeadAttributionFromRequest(input.headers.get("cookie"), input.body);
  try {
    await prisma.trafficEvent.create({
      data: {
        eventType: input.eventType,
        path: input.path ?? null,
        meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
        source: attr.source,
        campaign: attr.campaign,
        medium: attr.medium,
        sessionId: input.sessionId ?? null,
      },
    });
    void recordUserEventFromTraffic({
      eventType: input.eventType,
      path: input.path,
      meta: input.meta ?? null,
      sessionId: input.sessionId,
    });
  } catch (e) {
    console.warn("[traffic] record failed", e);
  }
}
