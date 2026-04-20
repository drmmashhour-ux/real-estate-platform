import { prisma } from "@/lib/db";
import type { AutonomyActionCandidate, ExecuteResult } from "@/modules/autonomy/autonomy.types";
import { startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import type { AutonomyConfig } from "@prisma/client";

function roundCents(d: number) {
  return Math.max(0, Math.round(d * 100));
}

/**
 * Execution is **strictly** mode-gated. Pricing auto-apply only for `listing` scope in `SAFE_AUTOPILOT`
 * and never when `pricingMode` is OFF (manual lock).
 */
export async function executeAutonomyAction(
  config: AutonomyConfig,
  action: AutonomyActionCandidate,
  scopeType: string,
  scopeId: string
): Promise<ExecuteResult> {
  const mode = config.mode as string;

  if (mode === "ASSIST") {
    return { status: "proposed", detail: "ASSIST: action proposed for host review (no auto-execution)" };
  }

  if (mode === "OFF") {
    return { status: "rejected", detail: "Mode OFF" };
  }

  if (mode === "FULL_AUTOPILOT_APPROVAL") {
    return { status: "approved", detail: "Full autopilot (approval): record for operator / host approval queue" };
  }

  if (mode === "SAFE_AUTOPILOT") {
    if (action.domain === "pricing" && scopeType === "listing") {
      return await applySafeListingPriceChange(scopeId, action, config);
    }
    return {
      status: "skipped",
      detail: "SAFE_AUTOPILOT: automation not wired for this domain/scope yet (deterministic stub)",
    };
  }

  return { status: "skipped", detail: `Unhandled mode ${mode}` };
}

async function applySafeListingPriceChange(
  listingId: string,
  action: AutonomyActionCandidate,
  config: AutonomyConfig
): Promise<ExecuteResult> {
  const pct = Number(action.payload.pct ?? 0);
  if (!Number.isFinite(pct)) {
    return { status: "skipped", detail: "Invalid pct payload" };
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      nightPriceCents: true,
      pricingMode: true,
      pricingSuggestionsEnabled: true,
      autoApplyMaxChange: true,
    },
  });

  if (!listing) {
    return { status: "rejected", detail: "Listing not found" };
  }

  /** Manual lock — never override */
  if (listing.pricingMode === "OFF") {
    return { status: "skipped", detail: "pricingMode OFF — manual lock (no autonomy override)" };
  }

  const maxPct = config.maxPriceChangePct ?? 0.25;
  if (Math.abs(pct) > maxPct + 1e-9) {
    return { status: "skipped", detail: `pct ${pct} exceeds policy maxPriceChangePct ${maxPct}` };
  }

  const old = listing.nightPriceCents / 100;
  const newDollars = old * (1 + pct);

  if (listing.autoApplyMaxChange != null && old > 1e-9) {
    const change = Math.abs(newDollars - old) / old;
    if (change > listing.autoApplyMaxChange + 1e-9) {
      return {
        status: "skipped",
        detail: `Would exceed listing autoApplyMaxChange (${(listing.autoApplyMaxChange * 100).toFixed(1)}%)`,
      };
    }
  }

  const executedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.shortTermListing.update({
      where: { id: listingId },
      data: { nightPriceCents: roundCents(newDollars) },
    });

    await tx.bnhubPricingExecutionLog.create({
      data: {
        listingId,
        date: startOfUtcDay(executedAt),
        oldPrice: old,
        newPrice: newDollars,
        mode: "cron_auto",
        status: "success",
        reason: `Autonomy SAFE_AUTOPILOT ${action.actionType}: ${(pct * 100).toFixed(2)}% vs prior published night rate`,
      },
    });
  });

  return { status: "executed", detail: "Night rate updated within policy", executedAt };
}
