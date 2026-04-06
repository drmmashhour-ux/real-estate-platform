import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";

/**
 * Product funnel events — persisted to `TrafficEvent` for admin/growth queries; always logs.
 */
export async function trackFunnelEvent(name: string, data?: Record<string, unknown>): Promise<void> {
  logInfo(`[funnel] ${name}`, data ?? {});
  try {
    await prisma.trafficEvent.create({
      data: {
        eventType: name,
        path: "/funnel",
        source: "funnel_tracker",
        medium: "product",
        meta: { ...(data ?? {}), v: 1 } as object,
      },
    });
  } catch {
    /* non-fatal */
  }
}
