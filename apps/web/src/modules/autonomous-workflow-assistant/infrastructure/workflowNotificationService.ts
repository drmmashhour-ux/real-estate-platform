import { captureServerEvent } from "@/lib/analytics/posthog-server";

/** Product analytics / future notification channel — no outbound email without explicit wiring. */
export function notifyWorkflowEvent(userId: string, event: string, props: Record<string, unknown>) {
  captureServerEvent(userId, event, props);
}
