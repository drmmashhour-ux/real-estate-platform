/**
 * Illustrative allocation + redeployment hints — not advice, no guarantees.
 */

import {
  ALLOCATION_CATEGORIES,
  type AllocationCategory,
  type AllocationSuggestion,
  type CapitalProfile,
  type RedeploymentSuggestion,
  type TrackedInvestment,
  type CategoryAllocationPct,
  type VentureRollup,
} from "./capital.types";

const LABELS: Record<AllocationCategory, string> = {
  startups: "Startups / private ventures",
  real_estate: "Real estate",
  public_markets: "Public markets",
  cash_reserve: "Cash reserve",
};

const BASE_BY_RISK: Record<CapitalProfile["riskProfile"], CategoryAllocationPct> = {
  conservative: {
    cash_reserve: 0.25,
    public_markets: 0.35,
    real_estate: 0.25,
    startups: 0.15,
  },
  balanced: {
    cash_reserve: 0.15,
    public_markets: 0.3,
    real_estate: 0.3,
    startups: 0.25,
  },
  aggressive: {
    cash_reserve: 0.1,
    public_markets: 0.2,
    real_estate: 0.25,
    startups: 0.45,
  },
};

function normalizeWeights(w: CategoryAllocationPct): CategoryAllocationPct {
  const sum = ALLOCATION_CATEGORIES.reduce((s, k) => s + (w[k] ?? 0), 0);
  if (sum <= 0) return { ...BASE_BY_RISK.balanced };
  const out = {} as CategoryAllocationPct;
  for (const k of ALLOCATION_CATEGORIES) {
    out[k] = (w[k] ?? 0) / sum;
  }
  return out;
}

/**
 * Suggest target mix from risk profile. Override with your own weights in UI if needed.
 */
export function suggestAllocation(profile: CapitalProfile): AllocationSuggestion {
  const base = normalizeWeights(BASE_BY_RISK[profile.riskProfile]);
  const themes: string[] = [
    `Post-exit planning often starts with clarifying liquidity needs before sizing illiquid sleeves (${LABELS.cash_reserve}).`,
    `${LABELS.public_markets} can provide breadth, but concentration and fees still matter — discuss with qualified advisors.`,
    `${LABELS.real_estate} may add diversification or cash-flow themes depending on your jurisdiction and tax situation (not modeled here).`,
    `${LABELS.startups} can be rewarding and volatile; sizing is a personal governance choice, not a platform recommendation.`,
  ];

  if (profile.riskProfile === "conservative") {
    themes.push("Conservative framing emphasizes runway and simpler structures in educational materials — not a product pick.");
  }
  if (profile.riskProfile === "aggressive") {
    themes.push("Aggressive framing assumes long horizons and tolerance for drawdowns — still requires explicit human decisions.");
  }

  return { targetWeights: base, themes };
}

export type AllocationTrackingSnapshot = {
  byCategory: Record<
    AllocationCategory,
    { amount: number; pctOfTotal: number | null }
  >;
  totalTracked: number;
  unallocatedLiquid: number;
};

/**
 * Derive allocation % from tracked rows vs total capital (educational math only).
 */
export function computeAllocationTracking(
  profile: CapitalProfile,
  investments: TrackedInvestment[]
): AllocationTrackingSnapshot {
  const byCategory = {} as AllocationTrackingSnapshot["byCategory"];
  for (const c of ALLOCATION_CATEGORIES) {
    byCategory[c] = { amount: 0, pctOfTotal: null };
  }
  let totalTracked = 0;
  for (const inv of investments) {
    byCategory[inv.category].amount += inv.amountCommitted;
    totalTracked += inv.amountCommitted;
  }
  const denom = profile.totalCapital > 0 ? profile.totalCapital : totalTracked;
  for (const c of ALLOCATION_CATEGORIES) {
    byCategory[c].pctOfTotal = denom > 0 ? byCategory[c].amount / denom : null;
  }
  const unallocatedLiquid = Math.max(0, profile.liquidCapital - totalTracked);
  return { byCategory, totalTracked, unallocatedLiquid };
}

/** Display key for rows with no `ventureName` — exported for dashboards. */
export const UNASSIGNED_VENTURE = "General / unassigned";

export function ventureLabel(inv: TrackedInvestment): string {
  const n = inv.ventureName?.trim();
  return n && n.length > 0 ? n : UNASSIGNED_VENTURE;
}

/**
 * Group tracked positions by `ventureName` for multi-venture dashboards.
 */
export function summarizeVentures(investments: TrackedInvestment[]): VentureRollup[] {
  const map = new Map<string, { rows: TrackedInvestment[] }>();
  for (const inv of investments) {
    const k = ventureLabel(inv);
    if (!map.has(k)) map.set(k, { rows: [] });
    map.get(k)!.rows.push(inv);
  }

  const rollups: VentureRollup[] = [];
  for (const [ventureName, { rows }] of map) {
    const byCategory = {} as Record<AllocationCategory, number>;
    for (const c of ALLOCATION_CATEGORIES) byCategory[c] = 0;
    let totalCommitted = 0;
    let w = 0;
    let num = 0;
    for (const r of rows) {
      totalCommitted += r.amountCommitted;
      byCategory[r.category] += r.amountCommitted;
      if (r.illustrativeReturnPct != null) {
        w += r.amountCommitted;
        num += r.amountCommitted * r.illustrativeReturnPct;
      }
    }
    rollups.push({
      ventureName,
      positionCount: rows.length,
      totalCommitted,
      illustrativeReturnPct: w > 0 ? num / w : null,
      byCategory,
    });
  }
  rollups.sort((a, b) => b.totalCommitted - a.totalCommitted);
  return rollups;
}

/**
 * Redeployment ideas — scenario text only.
 */
export function suggestRedeployment(
  profile: CapitalProfile,
  investments: TrackedInvestment[]
): RedeploymentSuggestion[] {
  const snap = computeAllocationTracking(profile, investments);
  const target = suggestAllocation(profile).targetWeights;
  const out: RedeploymentSuggestion[] = [];

  const cashPct = snap.byCategory.cash_reserve.pctOfTotal ?? 0;
  if (cashPct < target.cash_reserve - 0.05) {
    out.push({
      title: "Rebuild cash reserve (illustrative)",
      detail:
        "Liquidity is often replenished first after large deployments so you can navigate volatility without forced sales. This is a planning theme, not a mandate.",
      relatedCategories: ["cash_reserve"],
    });
  }

  const startupPct = snap.byCategory.startups.pctOfTotal ?? 0;
  if (startupPct < target.startups * 0.5 && profile.riskProfile !== "conservative") {
    out.push({
      title: "Venture sleeve underweight vs your chosen risk band",
      detail:
        "If you intentionally want venture exposure, consider how much illiquidity you accept — always document thesis and limits outside this tool.",
      relatedCategories: ["startups"],
    });
  }

  out.push({
    title: "Diversify intentionally",
    detail:
      "Spreading exposure across sleeves (real assets, liquid markets, reserve) is a risk-management concept to explore with professionals — not a guarantee of returns.",
    relatedCategories: ["real_estate", "public_markets", "cash_reserve"],
  });

  const ventures = summarizeVentures(investments);
  const namedVentures = ventures.filter((v) => v.ventureName !== UNASSIGNED_VENTURE);
  if (namedVentures.length >= 2) {
    out.push({
      title: "Multiple ventures — keep governance light",
      detail:
        "With several named ventures, a simple roll-up (totals per venture + sleeve) helps you review concentration without merging legal entities. Document decision rights per venture outside this tool.",
      relatedCategories: ["startups", "real_estate", "public_markets"],
    });
  }

  return out;
}

export { LABELS as ALLOCATION_CATEGORY_LABELS };
