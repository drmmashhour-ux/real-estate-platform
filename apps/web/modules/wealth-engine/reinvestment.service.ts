/**
 * Reinvestment ordering — educational heuristic only. Not investment advice.
 */

import {
  ALLOCATION_BUCKET_KEYS,
  type AllocationBucketKey,
  type ReinvestmentPlan,
  type ReinvestmentStep,
  type WealthProfile,
} from "./wealth.types";
import { compareCurrentVsTarget, DEFAULT_BUCKET_LABELS, suggestTargetAllocation } from "./allocation.service";

function newPlanId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wei-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DIVERSIFICATION_KEYS: AllocationBucketKey[] = [
  "PRIVATE_INVESTMENTS",
  "REAL_ESTATE",
  "PUBLIC_MARKETS",
  "OPPORTUNISTIC_CAPITAL",
];

/**
 * Build an ordered list of illustrative reinvestment steps from gaps vs targets.
 * Priority: strengthen reserve → operating ventures → diversification buckets (underweight first).
 */
export function generateReinvestmentPlan(profile: WealthProfile): ReinvestmentPlan {
  const comparisons = compareCurrentVsTarget(profile);
  const targets = suggestTargetAllocation(profile);
  const targetByKey = Object.fromEntries(targets.map((t) => [t.key, t.targetWeight])) as Record<
    AllocationBucketKey,
    number
  >;

  const underweight = [...comparisons]
    .filter((c) => c.gap < -0.005)
    .sort((a, b) => a.gap - b.gap);

  const steps: ReinvestmentStep[] = [];
  let p = 1;

  const push = (bucketKey: AllocationBucketKey, label: string, weightDelta?: number) => {
    steps.push({ priority: p++, bucketKey, label, suggestedWeightDelta: weightDelta });
  };

  const reserveGap = underweight.find((u) => u.bucketKey === "CASH_RESERVE");
  if (reserveGap) {
    push(
      "CASH_RESERVE",
      "Illustrative: allocate toward cash reserve until closer to your strategic target (liquidity and runway).",
      Math.min(0.05, -reserveGap.gap)
    );
  }

  const opGap = underweight.find((u) => u.bucketKey === "OPERATING_VENTURES");
  if (opGap) {
    push(
      "OPERATING_VENTURES",
      "Illustrative: consider reinvestment into operating ventures after reserve posture is intentional.",
      Math.min(0.05, -opGap.gap)
    );
  }

  for (const key of DIVERSIFICATION_KEYS) {
    const row = underweight.find((u) => u.bucketKey === key);
    if (row) {
      push(
        key,
        `Illustrative: diversification bucket ${DEFAULT_BUCKET_LABELS[key]} is below target — discuss timing and vehicles with advisors.`,
        Math.min(0.04, -row.gap)
      );
    }
  }

  const rationaleNotes = [
    "Order is a planning scaffold only: reserve first, then operating needs, then broader diversification.",
    "Amounts and weights are illustrative; they do not predict performance or optimal timing.",
    "Tax, legal, and liquidity constraints are not modeled here.",
  ];

  if (steps.length === 0) {
    steps.push({
      priority: 1,
      bucketKey: "CASH_RESERVE",
      label: "No large underweights detected vs illustrative targets — revisit after updating your profile or targets.",
    });
  }

  return {
    id: newPlanId(),
    generatedAt: new Date().toISOString(),
    steps,
    rationaleNotes,
  };
}

/**
 * Split a hypothetical new liquidity amount (minor units) using the same priority heuristic.
 */
export function allocateNewLiquidity(amountCents: number, profile: WealthProfile): ReinvestmentStep[] {
  if (amountCents <= 0) return [];

  const targets = suggestTargetAllocation(profile);
  const byKey = Object.fromEntries(profile.buckets.map((b) => [b.key, b])) as Record<
    AllocationBucketKey,
    (typeof profile.buckets)[0] | undefined
  >;

  const comparisons = compareCurrentVsTarget(profile);
  const reserveTarget = targets.find((t) => t.key === "CASH_RESERVE")!.targetWeight;
  const reserveCurrent = byKey.CASH_RESERVE?.currentWeight ?? 0;
  const reserveGapFrac = Math.max(0, reserveTarget - reserveCurrent);

  const steps: ReinvestmentStep[] = [];
  let remaining = amountCents;
  let p = 1;

  const toReserve = Math.round(Math.min(remaining, amountCents * Math.min(reserveGapFrac * 1.2, 0.5)));
  if (toReserve > 0 && reserveGapFrac > 0.01) {
    steps.push({
      priority: p++,
      bucketKey: "CASH_RESERVE",
      suggestedAmountCents: toReserve,
      label: "Portion directed to reserve posture (illustrative).",
    });
    remaining -= toReserve;
  }

  const opTarget = targets.find((t) => t.key === "OPERATING_VENTURES")!.targetWeight;
  const opCurrent = byKey.OPERATING_VENTURES?.currentWeight ?? 0;
  const opGapFrac = Math.max(0, opTarget - opCurrent);
  const toOp = Math.round(Math.min(remaining, remaining * (opGapFrac > 0.02 ? 0.35 : 0.15)));
  if (toOp > 0) {
    steps.push({
      priority: p++,
      bucketKey: "OPERATING_VENTURES",
      suggestedAmountCents: toOp,
      label: "Portion for strategic operating reinvestment (illustrative).",
    });
    remaining -= toOp;
  }

  const divGaps = comparisons
    .filter((c) => DIVERSIFICATION_KEYS.includes(c.bucketKey))
    .filter((c) => c.gap < 0)
    .sort((a, b) => a.gap - b.gap);

  if (remaining > 0 && divGaps.length > 0) {
    const share = Math.floor(remaining / divGaps.length);
    for (const g of divGaps) {
      steps.push({
        priority: p++,
        bucketKey: g.bucketKey,
        suggestedAmountCents: share,
        label: `Diversification flow toward ${DEFAULT_BUCKET_LABELS[g.bucketKey]} (illustrative).`,
      });
    }
    remaining -= share * divGaps.length;
  }

  if (remaining > 0) {
    steps.push({
      priority: p++,
      bucketKey: "OPPORTUNISTIC_CAPITAL",
      suggestedAmountCents: remaining,
      label: "Residual labeled opportunistic for planning discussion — not a mandate to deploy.",
    });
  }

  return steps;
}
