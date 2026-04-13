import { trackEvent } from "@/src/services/analytics";

export function trackBrokerAutopilot(
  eventType: string,
  metadata: Record<string, unknown> = {},
  opts?: { userId?: string | null }
): void {
  void trackEvent(eventType, metadata, opts).catch(() => {});
}
