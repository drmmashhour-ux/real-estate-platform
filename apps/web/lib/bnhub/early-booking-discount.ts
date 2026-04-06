/**
 * Listing-level `PricingRule` with ruleType EARLY_BOOKING.
 * Payload: { minLeadDays: number, discountPercent: number }
 * Optional validFrom / validTo bound the check-in date (inclusive day boundaries).
 */

import { nightsUntilCheckInUtc } from "@/lib/bnhub/early-booking";

export const PRICING_RULE_TYPE_EARLY_BOOKING = "EARLY_BOOKING";

export type EarlyBookingRulePayload = {
  minLeadDays: number;
  discountPercent: number;
};

const MAX_DISCOUNT_PERCENT = 35;

export function parseEarlyBookingPayload(payload: unknown): EarlyBookingRulePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  const minLeadDays = typeof o.minLeadDays === "number" ? Math.floor(o.minLeadDays) : Number.NaN;
  const discountPercent =
    typeof o.discountPercent === "number" ? o.discountPercent : Number.NaN;
  if (!Number.isFinite(minLeadDays) || minLeadDays < 1 || minLeadDays > 365) return null;
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > MAX_DISCOUNT_PERCENT) {
    return null;
  }
  return { minLeadDays, discountPercent: Math.round(discountPercent * 100) / 100 };
}

function checkInWithinRuleWindow(checkInIsoDate: string, validFrom: Date | null, validTo: Date | null): boolean {
  const parts = checkInIsoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return false;
  const checkDay = Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!);
  if (validFrom) {
    const vf = Date.UTC(validFrom.getUTCFullYear(), validFrom.getUTCMonth(), validFrom.getUTCDate());
    if (checkDay < vf) return false;
  }
  if (validTo) {
    const vt = Date.UTC(validTo.getUTCFullYear(), validTo.getUTCMonth(), validTo.getUTCDate());
    if (checkDay > vt) return false;
  }
  return true;
}

export type PricingRuleRow = {
  ruleType: string;
  payload: unknown;
  validFrom: Date | null;
  validTo: Date | null;
};

/**
 * Picks the single best rule for the guest (highest discount among applicable rules).
 */
export function resolveEarlyBookingDiscount(input: {
  grossNightlySubtotalCents: number;
  checkInIsoDate: string;
  rules: PricingRuleRow[];
  pricingAsOf?: Date;
}): { discountCents: number; label: string; appliedPercent: number; minLeadDays: number } | null {
  const gross = input.grossNightlySubtotalCents;
  if (gross <= 0) return null;

  const lead = nightsUntilCheckInUtc(input.checkInIsoDate, input.pricingAsOf ?? new Date());
  if (lead == null || lead < 1) return null;

  let best: { pct: number; minLead: number } | null = null;
  for (const r of input.rules) {
    if (r.ruleType !== PRICING_RULE_TYPE_EARLY_BOOKING) continue;
    if (!checkInWithinRuleWindow(input.checkInIsoDate, r.validFrom, r.validTo)) continue;
    const p = parseEarlyBookingPayload(r.payload);
    if (!p) continue;
    if (lead < p.minLeadDays) continue;
    if (!best || p.discountPercent > best.pct) {
      best = { pct: p.discountPercent, minLead: p.minLeadDays };
    }
  }

  if (!best) return null;

  let discountCents = Math.round((gross * best.pct) / 100);
  discountCents = Math.min(discountCents, gross - 1);
  if (discountCents <= 0) return null;

  const label = `Early booking (${best.pct}% off · ${best.minLead}+ days ahead)`;
  return {
    discountCents,
    label,
    appliedPercent: best.pct,
    minLeadDays: best.minLead,
  };
}

/** Clamp payload for API / upsert — mutates nothing, returns safe object. */
export function sanitizeEarlyBookingPayload(payload: Record<string, unknown>): EarlyBookingRulePayload | null {
  return parseEarlyBookingPayload(payload);
}
