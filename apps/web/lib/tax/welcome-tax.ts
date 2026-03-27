/**
 * Welcome / land transfer tax estimates from admin-configured brackets.
 * Estimate only — municipal rules and exemptions may vary.
 */

export type WelcomeTaxBracket = {
  /** Inclusive lower bound in cents (0 = start) */
  minCents: number;
  /** Exclusive upper bound in cents; null = no upper limit */
  maxCents: number | null;
  /** Rate applied to the portion of price that falls in this bracket (percent, e.g. 0.5 for 0.5%) */
  marginalRatePct: number;
};

export type BuyerTypeRebate = {
  /** Max rebate in cents (cap) */
  maxRebateCents?: number;
  /** Optional flat rebate % of calculated tax before cap */
  rebatePctOfTax?: number;
  notes?: string;
};

export type WelcomeTaxConfig = {
  brackets: WelcomeTaxBracket[];
  rebates?: Record<string, BuyerTypeRebate>;
};

export type WelcomeTaxBracketBreakdown = {
  label: string;
  taxableBaseCents: number;
  ratePct: number;
  taxCents: number;
};

export type WelcomeTaxResult = {
  totalCents: number;
  beforeRebateCents: number;
  rebateCents: number;
  buyerType: string;
  breakdown: WelcomeTaxBracketBreakdown[];
};

function parseBracketsJson(raw: unknown): WelcomeTaxBracket[] {
  if (!Array.isArray(raw)) return [];
  const out: WelcomeTaxBracket[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const minCents = Number(r.minCents ?? 0);
    const maxCents = r.maxCents === undefined || r.maxCents === null ? null : Number(r.maxCents);
    const marginalRatePct = Number(r.marginalRatePct ?? r.ratePct ?? 0);
    if (!Number.isFinite(minCents) || !Number.isFinite(marginalRatePct)) continue;
    out.push({
      minCents: Math.max(0, Math.floor(minCents)),
      maxCents: maxCents === null ? null : Math.max(0, Math.floor(maxCents)),
      marginalRatePct,
    });
  }
  return out.sort((a, b) => a.minCents - b.minCents);
}

/** Normalize DB JSON into typed config. */
export function parseWelcomeTaxConfigFromDb(bracketsJson: unknown, rebateRulesJson?: unknown): WelcomeTaxConfig {
  const brackets = parseBracketsJson(bracketsJson);
  let rebates: Record<string, BuyerTypeRebate> | undefined;
  if (rebateRulesJson && typeof rebateRulesJson === "object" && rebateRulesJson !== null) {
    rebates = rebateRulesJson as Record<string, BuyerTypeRebate>;
  }
  return { brackets, rebates };
}

/**
 * Progressive marginal brackets: each bracket applies only to the portion of the
 * purchase price (in cents) that falls between min and max.
 */
export function estimateWelcomeTaxFromConfig(
  purchasePriceCents: number,
  buyerType: string,
  config: WelcomeTaxConfig
): WelcomeTaxResult {
  const price = Math.max(0, Math.floor(purchasePriceCents));
  const breakdown: WelcomeTaxBracketBreakdown[] = [];
  let beforeRebate = 0;

  for (const b of config.brackets) {
    const lo = b.minCents;
    const hi = b.maxCents == null ? price : Math.min(b.maxCents, price);
    if (price <= lo || hi <= lo) continue;
    const taxable = Math.min(price, hi) - lo;
    if (taxable <= 0) continue;
    const tax = Math.round((taxable * b.marginalRatePct) / 100);
    beforeRebate += tax;
    breakdown.push({
      label:
        b.maxCents == null
          ? `$${(lo / 100).toLocaleString()} –`
          : `$${(lo / 100).toLocaleString()} – $${(b.maxCents / 100).toLocaleString()}`,
      taxableBaseCents: taxable,
      ratePct: b.marginalRatePct,
      taxCents: tax,
    });
  }

  let rebateCents = 0;
  const rule = config.rebates?.[buyerType] ?? config.rebates?.["default"];
  if (rule && beforeRebate > 0) {
    if (rule.rebatePctOfTax != null && rule.rebatePctOfTax > 0) {
      rebateCents = Math.round((beforeRebate * rule.rebatePctOfTax) / 100);
    }
    if (rule.maxRebateCents != null) {
      rebateCents = Math.min(rebateCents || beforeRebate, rule.maxRebateCents);
    }
  }

  const totalCents = Math.max(0, beforeRebate - rebateCents);

  return {
    totalCents,
    beforeRebateCents: beforeRebate,
    rebateCents,
    buyerType,
    breakdown,
  };
}
