/**
 * Weekly pricing decision helper: if the higher-price bucket keeps ≥80% of the lower bucket’s
 * conversion rate, operations can set `SYRIA_F1_PRICING_MODE=high` to make higher prices the default.
 */
export type F1BucketKpis = { bucket: 0 | 1; requests: number; confirmed: number; revenue: number };

export type F1WeeklyDecision = {
  conversion0: number;
  conversion1: number;
  /** `true` if bucket 1’s conversion ≥ 0.8 × bucket 0’s (recommend unifying on higher prices). */
  recommendHigherPriceDefault: boolean;
};

export function evaluateF1WeeklyPricingDecision(
  kpis: F1BucketKpis[],
  /** Avoid division by zero; default 1 request minimum for rate. */
  minRequests = 1,
): F1WeeklyDecision {
  const k0 = kpis.find((x) => x.bucket === 0);
  const k1 = kpis.find((x) => x.bucket === 1);
  const r0 = Math.max(k0?.requests ?? 0, minRequests);
  const r1 = Math.max(k1?.requests ?? 0, minRequests);
  const conversion0 = (k0?.confirmed ?? 0) / r0;
  const conversion1 = (k1?.confirmed ?? 0) / r1;
  const recommendHigherPriceDefault = conversion1 >= 0.8 * conversion0;
  return { conversion0, conversion1, recommendHigherPriceDefault };
}
