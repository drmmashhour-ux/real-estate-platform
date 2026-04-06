/**
 * LECIPM Manager growth engine — canonical funnel events in `launch_events`.
 * Prefix `growth:` distinguishes from legacy launch events; `user_id` column powers admin metrics.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

export const GROWTH_EVENT_NAMES = [
  "signup",
  "create_listing",
  "view_listing",
  "booking_start",
  "booking_complete",
  "referral_signup",
] as const;

export type LaunchGrowthEventName = (typeof GROWTH_EVENT_NAMES)[number];

export type GrowthEventPayload = {
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function eventKey(name: LaunchGrowthEventName): string {
  return `growth:${name}`;
}

/**
 * Persists a typed growth event (real rows only — no synthetic counts).
 */
export async function recordGrowthEvent(name: LaunchGrowthEventName, input: GrowthEventPayload = {}): Promise<void> {
  if (!GROWTH_EVENT_NAMES.includes(name)) return;
  const meta = input.metadata && typeof input.metadata === "object" ? input.metadata : {};
  try {
    await prisma.launchEvent.create({
      data: {
        event: eventKey(name),
        payload: { ...meta, v: 1 } as Prisma.InputJsonValue,
        userId: input.userId?.trim() || undefined,
        timestamp: new Date(),
      },
    });
  } catch (e) {
    logError("recordGrowthEvent failed", e);
  }
}

/** Mirrors growth event into `growth_funnel_events` when useful for funnel tooling. */
export async function mirrorGrowthToFunnel(name: LaunchGrowthEventName, input: GrowthEventPayload = {}): Promise<void> {
  const meta = input.metadata && typeof input.metadata === "object" ? input.metadata : {};
  try {
    await prisma.growthFunnelEvent.create({
      data: {
        eventName: eventKey(name),
        userId: input.userId?.trim() || undefined,
        properties: { ...meta, v: 1 } as Prisma.InputJsonValue,
      },
    });
  } catch {
    /* optional */
  }
}

export async function recordGrowthEventWithFunnel(name: LaunchGrowthEventName, input: GrowthEventPayload = {}): Promise<void> {
  await recordGrowthEvent(name, input);
  void mirrorGrowthToFunnel(name, input);
}

/** Referrer visibility boost (ops flag — not a financial payout). */
export async function grantReferrerVisibilityBoostOnGuestBookingComplete(guestUserId: string): Promise<void> {
  try {
    const ref = await prisma.referral.findFirst({
      where: { usedByUserId: guestUserId },
      select: { referrerId: true },
    });
    if (!ref) return;
    await prisma.referralReward.create({
      data: {
        userId: ref.referrerId,
        rewardType: "visibility_boost",
        value: "booking_complete_guest",
      },
    });
  } catch {
    /* idempotent-ish: ignore duplicates if any */
  }
}

export function legacyPersistForGrowth(
  legacyEvent: string,
  payload: Record<string, unknown>,
  userId?: string | null
): void {
  void persistLaunchEvent(legacyEvent, payload, { userId: userId ?? undefined });
}

export function fireViewListingGrowth(input: {
  userId?: string | null;
  listingId: string;
  city?: string | null;
  listingKind: string;
}): void {
  void recordGrowthEventWithFunnel("view_listing", {
    userId: input.userId ?? undefined,
    metadata: {
      listingId: input.listingId,
      city: input.city ?? undefined,
      listingKind: input.listingKind,
    },
  });
}

export { recordLecipmManagerGrowthEvent } from "./manager-events";
export type { GrowthEvent, GrowthEventInput, GrowthEventName, GrowthUiLocale } from "./types";
export { MANAGER_GROWTH_EVENT_NAMES } from "./types";
