/**
 * Broker commission on residential deals (listing side — configurable).
 * BNHUB / short-stay platform fee (e.g. 15%) is unrelated and tracked separately.
 */

export const DEFAULT_BROKER_COMMISSION_RATE = 0.025;
export const PLATFORM_BNHUB_HOST_FEE_RATE = 0.15; // reference for dashboards / copy only

/** Parse BROKER_COMMISSION_RATE from env (e.g. "0.025" or "2.5" for 2.5%). */
export function getBrokerCommissionRate(): number {
  const raw = process.env.BROKER_COMMISSION_RATE?.trim();
  if (!raw) return DEFAULT_BROKER_COMMISSION_RATE;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return DEFAULT_BROKER_COMMISSION_RATE;
  if (n > 0.25) return n / 100;
  return n;
}

/** Estimated broker commission in whole dollars (CAD). */
export function estimateBrokerCommissionDollars(dealValueDollars: number | null | undefined): number | null {
  if (dealValueDollars == null || !Number.isFinite(dealValueDollars) || dealValueDollars <= 0) return null;
  const rate = getBrokerCommissionRate();
  return Math.round(dealValueDollars * rate);
}
