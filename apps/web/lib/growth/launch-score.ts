import { prisma } from "@/lib/db";
import { getResolvedMarket } from "@/lib/markets/resolve-market";
import type { MarketCode } from "@/lib/markets/types";

export type LaunchReadinessLevel = "green" | "yellow" | "red";

export interface LaunchReadinessScore {
  marketCode: MarketCode;
  score: number;
  level: LaunchReadinessLevel;
  blockers: string[];
  warnings: string[];
  nextActions: string[];
}

/**
 * Heuristic 0–100 score from live DB signals (Syria vs default). Ops-facing, not a legal guarantee.
 */
export async function computeLaunchReadinessScore(): Promise<LaunchReadinessScore> {
  const resolved = await getResolvedMarket();
  const marketCode = resolved.code;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const nextActions: string[] = [];
  let points = 0;

  const settings = await prisma.platformMarketLaunchSettings.findUnique({
    where: { id: "default" },
  });

  const onlineOk = settings?.onlinePaymentsEnabled !== false;
  const manualOk = settings?.manualPaymentTrackingEnabled === true;
  if (marketCode === "syria" || settings?.syriaModeEnabled) {
    if (!manualOk) {
      blockers.push("Syria-style mode expects manual payment tracking enabled.");
    } else {
      points += 20;
    }
    if (onlineOk) {
      warnings.push("Syria profile often disables online card checkout — confirm `onlinePaymentsEnabled` matches launch intent.");
      points += 5;
    } else {
      points += 15;
    }
  } else {
    if (onlineOk) points += 25;
    else {
      blockers.push("Default market has online payments disabled — Stripe booking path may be blocked.");
    }
    if (manualOk) points += 5;
  }

  const publishedListings = await prisma.shortTermListing.count({
    where: { listingStatus: "PUBLISHED" },
  });
  if (publishedListings >= 25) points += 20;
  else if (publishedListings >= 5) {
    points += 12;
    warnings.push(`Only ${publishedListings} published short-term listings — aim for 25+ for launch density.`);
  } else {
    points += 4;
    nextActions.push("Recruit first hosts and publish starter inventory.");
  }

  const pendingBookings = await prisma.booking.count({
    where: { status: { in: ["PENDING", "AWAITING_HOST_APPROVAL"] } },
  });
  if (pendingBookings < 200) points += 15;
  else {
    warnings.push(`${pendingBookings} bookings in pending / awaiting host — clear ops queue.`);
    points += 8;
  }

  points += 10;

  const docsHint = await prisma.launchEvent.count({
    where: { event: { startsWith: "mgr:" }, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });
  if (docsHint > 5) points += 10;
  else points += 4;

  const score = Math.max(0, Math.min(100, points));
  const level: LaunchReadinessLevel =
    score >= 75 ? "green" : score >= 45 ? "yellow" : "red";

  if (level === "red" && nextActions.length === 0) {
    nextActions.push("Review `docs/launch/SOFT-LAUNCH-CHECKLIST.md` and market toggles in admin.");
  }

  return {
    marketCode,
    score,
    level,
    blockers,
    warnings,
    nextActions,
  };
}
