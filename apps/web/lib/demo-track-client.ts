import type { DemoEventName } from "@/lib/demo-event-types";
import { isDemoTourRuntimeEnabled } from "@/lib/demo/demo-env";

/** Client-side demo analytics when staging or `NEXT_PUBLIC_DEMO_TOUR=1`. */
export function trackDemoClient(event: DemoEventName, metadata?: Record<string, unknown>): void {
  if (!isDemoTourRuntimeEnabled()) return;
  void fetch("/api/demo/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ event, metadata }),
  }).catch(() => {});
}
