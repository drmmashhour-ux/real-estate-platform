import { captureServerEvent } from "@/lib/analytics/posthog-server";
import type { FunnelEventName } from "@/src/modules/growth-funnel/domain/funnelEvents";
import { insertFunnelEvent } from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

/**
 * Persists funnel events for dashboards + forwards to PostHog when configured.
 */
export async function trackGrowthFunnelEvent(args: {
  userId: string | null;
  eventName: FunnelEventName;
  properties?: Record<string, unknown>;
}): Promise<void> {
  const distinctId = args.userId ?? (typeof args.properties?.anonymousId === "string" ? args.properties.anonymousId : "anonymous");
  captureServerEvent(distinctId, args.eventName, args.properties ?? {});
  try {
    await insertFunnelEvent({
      userId: args.userId,
      eventName: args.eventName,
      properties: args.properties,
    });
  } catch {
    /* non-fatal: analytics must not break primary flows */
  }
}
