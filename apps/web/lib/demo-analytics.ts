import { prisma } from "@/lib/db";
import { DemoEvents, type DemoEventName } from "@/lib/demo-event-types";

/** Maps platform roles to demo funnel segments (no PII). */
export function demoSegmentFromRole(role: string): "client" | "investor" | "broker" {
  const r = role.toUpperCase();
  if (r === "BROKER" || r === "MORTGAGE_EXPERT" || r === "MORTGAGE_BROKER") return "broker";
  if (r === "DEVELOPER") return "investor";
  return "client";
}

/**
 * Staging-only analytics (see DemoEvent model). No-op when not staging.
 */
export async function trackDemoEvent(
  event: DemoEventName,
  metadata?: Record<string, unknown>,
  userId?: string | null
): Promise<void> {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") return;
  try {
    await prisma.demoEvent.create({
      data: {
        event,
        metadata: metadata === undefined ? undefined : (metadata as object),
        userId: userId ?? undefined,
      },
    });
  } catch (e) {
    console.warn("[demo-analytics]", e);
  }
}

/** Optional: call after login in staging to segment demo analytics. */
export function trackDemoUserTypeFromRole(userId: string, role: string): void {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") return;
  const type = demoSegmentFromRole(role);
  void trackDemoEvent(DemoEvents.USER_TYPE, { type }, userId);
}
