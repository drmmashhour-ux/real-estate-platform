/**
 * Same gate as legacy `validate-platform-launch-events.ts` — launch_events row counts.
 */
import { PrismaClient } from "@prisma/client";

const TRACKED_EVENTS = [
  "USER_SIGNUP",
  "USER_LOGIN",
  "VIEW_LISTING",
  "CONTACT_BROKER",
  "CREATE_BOOKING",
  "PAYMENT_SUCCESS",
  "CHECKOUT_BLOCKED",
] as const;

export async function runLaunchEventsGate(prisma: PrismaClient): Promise<{
  ready: boolean;
  counts: Record<string, number>;
  issues: string[];
}> {
  const counts: Record<string, number> = {};
  for (const ev of TRACKED_EVENTS) {
    counts[ev] = await prisma.launchEvent.count({ where: { event: ev } }).catch(() => 0);
  }

  const issues: string[] = [];
  for (const ev of TRACKED_EVENTS) {
    if ((counts[ev] ?? 0) < 1) {
      issues.push(`${ev}: need >= 1 row, got ${counts[ev] ?? 0}`);
    }
  }

  return { ready: issues.length === 0, counts, issues };
}
