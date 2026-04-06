import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import type { GrowthEventName, GrowthEventInput } from "./types";
import { MANAGER_GROWTH_EVENT_NAMES } from "./types";

const LAUNCH_PREFIX = "mgr:";

function isManagerEventName(s: string): s is GrowthEventName {
  return (MANAGER_GROWTH_EVENT_NAMES as readonly string[]).includes(s);
}

/**
 * Persists a manager growth event to `growth_funnel_events` and mirrors to `launch_events` for ops dashboards.
 */
export async function recordLecipmManagerGrowthEvent(
  name: GrowthEventName,
  input: GrowthEventInput = {},
): Promise<void> {
  if (!isManagerEventName(name)) return;
  const meta: Record<string, unknown> = {
    v: 2,
    ...(input.metadata && typeof input.metadata === "object" ? input.metadata : {}),
  };
  if (input.listingId) meta.listingId = input.listingId;
  if (input.marketCode) meta.marketCode = input.marketCode;
  if (input.locale) meta.locale = input.locale;

  const json = meta as Prisma.InputJsonValue;
  const uid = input.userId?.trim() || undefined;

  try {
    await prisma.growthFunnelEvent.create({
      data: {
        eventName: name,
        userId: uid,
        properties: json,
      },
    });
  } catch (e) {
    logError("recordLecipmManagerGrowthEvent: funnel insert failed", e);
  }

  try {
    await prisma.launchEvent.create({
      data: {
        event: `${LAUNCH_PREFIX}${name}`,
        payload: json,
        userId: uid,
      },
    });
  } catch (e) {
    logError("recordLecipmManagerGrowthEvent: launch_event insert failed", e);
  }
}
