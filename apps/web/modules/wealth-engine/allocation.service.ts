/**
 * Allocation helpers — educational / scenario-based. Not investment advice.
 */

import {
  ALLOCATION_BUCKET_KEYS,
  type AllocationBucket,
  type AllocationBucketKey,
  type OverconcentrationFlag,
  type RiskBand,
  type AllocationComparisonRow,
  type WealthProfile,
} from "./wealth.types";

export const DEFAULT_BUCKET_LABELS: Record<AllocationBucketKey, string> = {
  CASH_RESERVE: "Cash reserve",
  OPERATING_VENTURES: "Operating ventures",
  PRIVATE_INVESTMENTS: "Private investments",
  REAL_ESTATE: "Real estate",
  PUBLIC_MARKETS: "Public markets",
  OPPORTUNISTIC_CAPITAL: "Opportunistic capital",
};

/** Illustrative strategic targets by risk posture — fully configurable via profile overrides. */
export const RISK_BAND_DEFAULT_TARGETS: Record<
  Exclude<RiskBand, "CUSTOM">,
  Record<AllocationBucketKey, number>
> = {
  CONSERVATIVE: {
    CASH_RESERVE: 0.22,
    OPERATING_VENTURES: 0.12,
    PRIVATE_INVESTMENTS: 0.08,
    REAL_ESTATE: 0.22,
    PUBLIC_MARKETS: 0.28,
    OPPORTUNISTIC_CAPITAL: 0.08,
  },
  BALANCED: {
    CASH_RESERVE: 0.15,
    OPERATING_VENTURES: 0.18,
    PRIVATE_INVESTMENTS: 0.12,
    REAL_ESTATE: 0.22,
    PUBLIC_MARKETS: 0.23,
    OPPORTUNISTIC_CAPITAL: 0.1,
  },
  AGGRESSIVE: {
    CASH_RESERVE: 0.1,
    OPERATING_VENTURES: 0.25,
    PRIVATE_INVESTMENTS: 0.15,
    REAL_ESTATE: 0.2,
    PUBLIC_MARKETS: 0.18,
    OPPORTUNISTIC_CAPITAL: 0.12,
  },
};

function normalizeWeights(weights: Record<AllocationBucketKey, number>): Record<AllocationBucketKey, number> {
  const sum = ALLOCATION_BUCKET_KEYS.reduce((s, k) => s + (weights[k] ?? 0), 0);
  if (sum <= 0) return { ...RISK_BAND_DEFAULT_TARGETS.BALANCED };
  const out = {} as Record<AllocationBucketKey, number>;
  for (const k of ALLOCATION_BUCKET_KEYS) {
    out[k] = (weights[k] ?? 0) / sum;
  }
  return out;
}

/** Strategic targets: risk-band defaults, optional per-bucket overrides, or fully custom weights from the profile. */
export function suggestTargetAllocation(profile: WealthProfile): AllocationBucket[] {
  let base: Record<AllocationBucketKey, number>;
  if (profile.riskBand === "CUSTOM") {
    base = normalizeWeights(
      Object.fromEntries(profile.buckets.map((b) => [b.key, b.targetWeight])) as Record<
        AllocationBucketKey,
        number
      >
    );
  } else {
    base = { ...RISK_BAND_DEFAULT_TARGETS[profile.riskBand] };
    if (profile.customTargetsByBucket) {
      for (const k of ALLOCATION_BUCKET_KEYS) {
        const v = profile.customTargetsByBucket[k];
        if (v != null) base[k] = v;
      }
      base = normalizeWeights(base);
    }
  }

  return ALLOCATION_BUCKET_KEYS.map((key) => {
    const existing = profile.buckets.find((b) => b.key === key);
    return {
      key,
      label: existing?.label ?? DEFAULT_BUCKET_LABELS[key],
      targetWeight: base[key],
      currentWeight: existing?.currentWeight ?? 0,
      currentAmountCents: existing?.currentAmountCents,
      notes: existing?.notes,
    };
  });
}

export function compareCurrentVsTarget(profile: WealthProfile): AllocationComparisonRow[] {
  const suggested = suggestTargetAllocation(profile);
  return suggested.map((b) => ({
    bucketKey: b.key,
    targetWeight: b.targetWeight,
    currentWeight: b.currentWeight,
    gap: b.currentWeight - b.targetWeight,
  }));
}

const SINGLE_BUCKET_CEILING = 0.45;
const GAP_CEILING = 0.15;

export function identifyOverconcentration(profile: WealthProfile): OverconcentrationFlag[] {
  const flags: OverconcentrationFlag[] = [];
  const comparisons = compareCurrentVsTarget(profile);

  for (const row of comparisons) {
    if (row.currentWeight >= SINGLE_BUCKET_CEILING) {
      flags.push({
        bucketKey: row.bucketKey,
        severity: row.currentWeight >= SINGLE_BUCKET_CEILING + 0.1 ? "ELEVATED" : "WATCH",
        message: `A large share of wealth is in ${DEFAULT_BUCKET_LABELS[row.bucketKey]} (${(row.currentWeight * 100).toFixed(0)}%). Diversification is a risk-management concept to discuss with qualified professionals.`,
      });
    } else if (row.gap > GAP_CEILING) {
      flags.push({
        bucketKey: row.bucketKey,
        severity: row.gap > GAP_CEILING + 0.1 ? "ELEVATED" : "WATCH",
        message: `${DEFAULT_BUCKET_LABELS[row.bucketKey]} is above the illustrative target for this scenario by about ${(row.gap * 100).toFixed(0)} percentage points.`,
      });
    }
  }

  if (
    profile.primaryVentureWeight != null &&
    profile.primaryVentureWeight >= 0.35
  ) {
    flags.push({
      bucketKey: "OPERATING_VENTURES",
      severity: profile.primaryVentureWeight >= 0.5 ? "ELEVATED" : "WATCH",
      message:
        "Operating / single-company exposure appears material relative to total wealth. Consider documenting dependencies and liquidity paths in a planning conversation — not a directive to buy or sell.",
    });
  }

  return flags;
}
