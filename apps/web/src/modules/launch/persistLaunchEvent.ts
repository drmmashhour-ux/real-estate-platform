import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";

function inferUserIdFromPayload(payload: Record<string, unknown>): string | undefined {
  const candidates = ["userId", "referredUserId", "guestId", "hostId", "ownerId", "referrerId"] as const;
  for (const k of candidates) {
    const v = payload[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

export type PersistLaunchEventOptions = {
  timestamp?: Date;
  /** When set, stored on `launch_events.user_id` for growth dashboards. */
  userId?: string | null;
};

/**
 * Server-only insert into `launch_events`. Never throws.
 */
export async function persistLaunchEvent(
  event: string,
  payload: Record<string, unknown> = {},
  timestampOrOpts?: Date | PersistLaunchEventOptions
): Promise<void> {
  const opts: PersistLaunchEventOptions =
    timestampOrOpts instanceof Date || timestampOrOpts == null
      ? { timestamp: timestampOrOpts instanceof Date ? timestampOrOpts : undefined }
      : timestampOrOpts;
  const userId = opts.userId ?? inferUserIdFromPayload(payload);
  try {
    await prisma.launchEvent.create({
      data: {
        event: event.slice(0, 128),
        payload: payload as Prisma.InputJsonValue,
        timestamp: opts.timestamp ?? new Date(),
        userId: userId ?? undefined,
      },
    });
  } catch (e) {
    logError("persistLaunchEvent failed", e);
  }
}
