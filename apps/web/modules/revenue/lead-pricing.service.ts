/**
 * Deterministic lead value + suggested unlock price (CAD). Does not mutate leads or Stripe.
 * Price bands from `PRICING_CONFIG` (Canada / Montréal-aligned anchors).
 */

import { PRICING } from "@/lib/monetization/pricing";
import { PRICING_CONFIG } from "@/modules/revenue/pricing-config";

export type LeadValueBand = "low" | "medium" | "high";

export type LeadPricingInput = {
  message?: string | null;
  leadSource?: string | null;
  leadType?: string | null;
  /** Legacy CRM score 0–100 */
  score?: number | null;
  engagementScore?: number | null;
  /** Count of CRM interactions / timeline touches when available */
  interactionCount?: number;
  /** When false, confidence is reduced (pricing uses mid band). */
  hasCompleteContact?: boolean;
};

export type LeadPricingResult = {
  leadValue: LeadValueBand;
  /** 0–100 composite */
  leadScore: number;
  /** Whole CAD dollars (2 dp) — display / Stripe amount derived from cents separately */
  leadPrice: number;
  /** Suggested charge in cents for Stripe */
  leadPriceCents: number;
  confidence: "high" | "medium" | "low";
};

const INVEST_RE = /\b(invest|investment|investir|rendement|cap rate|cap-rate|roi|multiplex|plex|revenue property)\b/i;
const URGENT_RE = /\b(urgent|asap|vite|imm[ée]diat|quick close|closing fast|this week)\b/i;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Interpolate CAD dollars within the score sub-range for `leadValue` using `PRICING_CONFIG.canada.lead` bands. */
function priceDollarsFromScoreAndBand(score: number, leadValue: LeadValueBand): number {
  const L = PRICING_CONFIG.canada.lead;
  let sLo: number;
  let sHi: number;
  let dLo: number;
  let dHi: number;
  if (leadValue === "low") {
    sLo = 0;
    sHi = 37;
    [dLo, dHi] = L.low;
  } else if (leadValue === "medium") {
    sLo = 38;
    sHi = 71;
    [dLo, dHi] = L.medium;
  } else {
    sLo = 72;
    sHi = 100;
    [dLo, dHi] = L.high;
  }
  const t = sHi === sLo ? 0.5 : (clamp(score, sLo, sHi) - sLo) / (sHi - sLo);
  return dLo + t * (dHi - dLo);
}

/**
 * Computes tier, score, and price. Price uses `PRICING_CONFIG` bands mapped from `leadScore`, clamped to min/max cents.
 * Per-lead `basePriceCents` (dynamic override) wins when set.
 */
export function computeLeadValueAndPrice(
  lead: LeadPricingInput,
  opts?: {
    basePriceCents?: number;
    minCents?: number;
    maxCents?: number;
    /** Admin DB override for default anchor (cents); falls back to `PRICING_CONFIG.canada.lead.default` */
    defaultLeadPriceCents?: number | null;
  },
): LeadPricingResult {
  const cfgDefaultCents = PRICING_CONFIG.canada.lead.default * 100;
  const defaultAnchorCents =
    opts?.defaultLeadPriceCents != null && opts.defaultLeadPriceCents > 0
      ? opts.defaultLeadPriceCents
      : cfgDefaultCents;

  const baseFallback = opts?.basePriceCents ?? PRICING.leadPriceCents;
  const minC = opts?.minCents ?? Math.min(baseFallback, 9_900);
  const maxC = opts?.maxCents ?? Math.max(baseFallback, 79_900);

  const msg = (lead.message ?? "").trim();
  const blob = `${msg} ${lead.leadType ?? ""} ${lead.leadSource ?? ""}`.toLowerCase();

  let score = 42;
  if (INVEST_RE.test(blob)) score += 28;
  if (URGENT_RE.test(blob)) score += 12;
  if ((lead.leadType ?? "").toLowerCase().includes("invest")) score += 15;

  const eng = lead.engagementScore ?? 0;
  score += clamp(eng * 0.15, 0, 18);

  const interactions = lead.interactionCount ?? 0;
  score += clamp(interactions * 5, 0, 20);

  const crm = lead.score ?? 50;
  score += clamp((crm - 50) * 0.25, -12, 18);

  if (lead.hasCompleteContact === false || (!msg && interactions === 0)) {
    score -= 10;
  }

  score = Math.round(clamp(score, 0, 100));

  let leadValue: LeadValueBand = "medium";
  if (score >= 72) leadValue = "high";
  else if (score < 38) leadValue = "low";

  let confidence: LeadPricingResult["confidence"] = "medium";
  if (lead.hasCompleteContact === false || (!msg && interactions === 0)) confidence = "low";
  else if (interactions >= 2 && msg.length >= 40) confidence = "high";

  let cents: number;
  if (opts?.basePriceCents != null && opts.basePriceCents > 0) {
    cents = Math.round(opts.basePriceCents);
  } else {
    let dollars = priceDollarsFromScoreAndBand(score, leadValue);
    /** Anchor toward admin override or config default (Montréal-style $49) */
    const anchorDollars = defaultAnchorCents / 100;
    dollars = dollars * 0.85 + anchorDollars * 0.15;
    cents = Math.round(dollars * 100);
  }

  cents = clamp(cents, minC, maxC);

  const leadPrice = round2(cents / 100);

  return {
    leadValue,
    leadScore: score,
    leadPrice,
    leadPriceCents: cents,
    confidence,
  };
}

/** Alias for integrations expecting `{ score, value, price }` — same rules as `computeLeadValueAndPrice`. */
export function computeLeadPrice(
  lead: LeadPricingInput,
  opts?: Parameters<typeof computeLeadValueAndPrice>[1],
): { score: number; value: LeadValueBand; price: number } {
  const r = computeLeadValueAndPrice(lead, opts);
  return { score: r.leadScore, value: r.leadValue, price: r.leadPrice };
}
