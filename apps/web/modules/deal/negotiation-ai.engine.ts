export type NegotiationStrategyType = "AGGRESSIVE" | "BALANCED" | "SAFE";

export type NegotiationStrategyEngineRow = {
  strategyType: NegotiationStrategyType;
  suggestedPrice: number;
  conditionChangesJson: Array<{ change: string; detail?: string }>;
  timelineSuggestion: string;
  reasoningJson: {
    summary: string;
    bullets: string[];
    riskReward: { risk: string; reward: string };
  };
  confidenceScore: number;
};

export type NegotiationAiContext = {
  dealPriceCad: number;
  listPriceCad: number | null;
  comparableMedianCad: number | null;
  comparableSampleSize: number;
  buyerSellerMotivationNote: string;
  urgencyDaysSinceActivity: number;
  priorOfferCount: number;
  inspectionStress: "low" | "medium" | "high";
  financingStrength: "weak" | "moderate" | "strong";
  dealStatus: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function roundMoney(n: number): number {
  return Math.round(n / 500) * 500;
}

/**
 * Deterministic counter-offer packages — assistive only; broker must approve before any send.
 * Assumes seller-side counter when deal price is below list (raise toward ask). If above list, trims toward list.
 */
export function computeNegotiationStrategies(ctx: NegotiationAiContext): NegotiationStrategyEngineRow[] {
  const current = ctx.dealPriceCad;
  const list = ctx.listPriceCad;
  const comp = ctx.comparableMedianCad;

  const fair =
    list != null && comp != null
      ? clamp(0.45 * current + 0.35 * list + 0.2 * comp, Math.min(current, list, comp) * 0.92, Math.max(current, list, comp) * 1.05)
      : list != null
        ? clamp(0.55 * current + 0.45 * list, current * 0.9, list * 1.08)
        : comp != null
          ? clamp(0.65 * current + 0.35 * comp, current * 0.9, comp * 1.1)
          : current;

  const targetBelowList = (pct: number) => {
    if (list == null) return roundMoney(current + (fair - current) * pct);
    return roundMoney(current + (list - current) * pct);
  };
  /** Offer above ask: move down toward list; higher pct = closer to list (larger concession). */
  const targetAboveList = (pct: number) => {
    if (list == null) return roundMoney(current + (fair - current) * pct);
    return roundMoney(current - (current - list) * pct);
  };

  let aggressivePrice: number;
  let balancedPrice: number;
  let safePrice: number;

  if (list != null && current < list - 1) {
    aggressivePrice = targetBelowList(0.62);
    balancedPrice = targetBelowList(0.42);
    safePrice = targetBelowList(0.22);
  } else if (list != null && current > list + 1) {
    aggressivePrice = targetAboveList(0.18);
    balancedPrice = targetAboveList(0.36);
    safePrice = targetAboveList(0.55);
  } else if (list != null) {
    aggressivePrice = targetBelowList(0.28);
    balancedPrice = targetBelowList(0.18);
    safePrice = targetBelowList(0.1);
  } else {
    aggressivePrice = roundMoney(current + (fair - current) * 0.4);
    balancedPrice = roundMoney(current + (fair - current) * 0.26);
    safePrice = roundMoney(current + (fair - current) * 0.14);
  }

  const dataQuality =
    (list != null ? 0.35 : 0) +
    (ctx.comparableSampleSize >= 8 ? 0.35 : ctx.comparableSampleSize >= 3 ? 0.22 : 0.08) +
    (ctx.priorOfferCount > 0 ? 0.15 : 0) +
    0.15;
  const stressPenalty = ctx.inspectionStress === "high" ? 12 : ctx.inspectionStress === "medium" ? 6 : 0;
  const financingPenalty = ctx.financingStrength === "weak" ? 10 : ctx.financingStrength === "moderate" ? 4 : 0;
  const urgencyPenalty = clamp((ctx.urgencyDaysSinceActivity - 10) * 0.35, 0, 14);

  const baseConfidence = clamp(Math.round((dataQuality * 100 - stressPenalty - financingPenalty - urgencyPenalty) * 10) / 10, 38, 91);

  const conditionsAggressive: NegotiationStrategyEngineRow["conditionChangesJson"] = [
    { change: "Tighten", detail: "Keep material conditions; trim non-essential asks where regulator allows." },
    { change: "Inspection posture", detail: ctx.inspectionStress === "high" ? "Retain inspection rights; avoid waiving material defects review." : "Prefer minor carve-outs only after licensed review." },
  ];
  const conditionsBalanced: NegotiationStrategyEngineRow["conditionChangesJson"] = [
    {
      change: "Remove minor condition",
      detail: "Consider dropping low-risk administrative conditions if counterpart yields on price/timing.",
    },
    { change: "Financing mirror", detail: "Align financing condition deadlines with lender turnaround (assistive timing only)." },
  ];
  const conditionsSafe: NegotiationStrategyEngineRow["conditionChangesJson"] = [
    { change: "Preserve protections", detail: "Limit concessions to price/timing; keep financing + title protections unless counsel advises otherwise." },
    { change: "Document trail", detail: "Ensure every change is mirrored in the written promise — no verbal-only agreements." },
  ];

  const timelines = {
    aggressive: "Target close in 21–30 days if diligence permits; accelerate only with broker sign-off.",
    balanced: "Close in ~30 days — balances lender + inspection cadence.",
    safe: "Close in 35–45 days — extra buffer for financing and title.",
  };

  const marketNote =
    ctx.comparableSampleSize >= 6
      ? "Market comparables show a moderate sample — pricing band is more reliable."
      : ctx.comparableSampleSize >= 1
        ? "Limited comps — widen negotiation slack and verify with broker pricing work-up."
        : "Sparse comp data — lean on list price + file facts; confidence is discounted.";

  const rows: NegotiationStrategyEngineRow[] = [
    {
      strategyType: "AGGRESSIVE",
      suggestedPrice: aggressivePrice,
      conditionChangesJson: conditionsAggressive,
      timelineSuggestion: timelines.aggressive,
      reasoningJson: {
        summary: "Maximize economic gain for your client while accepting higher walk-away risk.",
        bullets: [
          ctx.buyerSellerMotivationNote,
          marketNote,
          `Prior tracked offers/rounds in file: ${ctx.priorOfferCount}.`,
          ctx.financingStrength === "weak" ? "Financing looks soft — aggressive price moves need lender reality-check." : "Financing posture supports firmer pricing.",
        ],
        riskReward: {
          risk: "Higher impasse risk; may require faster concessions if buyer/seller disengages.",
          reward: "Improved price or terms versus midpoint counter.",
        },
      },
      confidenceScore: clamp(baseConfidence - 6, 30, 88),
    },
    {
      strategyType: "BALANCED",
      suggestedPrice: balancedPrice,
      conditionChangesJson: conditionsBalanced,
      timelineSuggestion: timelines.balanced,
      reasoningJson: {
        summary: "Blend of price movement and relationship preservation — typically highest practical success rate.",
        bullets: [
          "Seller motivation + market tone support a midpoint-style counter.",
          ctx.inspectionStress !== "low" ? "Inspection/diligence friction suggests measured—not maximal—price push." : "Diligence signals are manageable for a standard counter package.",
          marketNote,
        ],
        riskReward: {
          risk: "May leave modest money on the table versus an aggressive posture.",
          reward: "Higher likelihood of acceptance and continued goodwill.",
        },
      },
      confidenceScore: baseConfidence,
    },
    {
      strategyType: "SAFE",
      suggestedPrice: safePrice,
      conditionChangesJson: conditionsSafe,
      timelineSuggestion: timelines.safe,
      reasoningJson: {
        summary: "Secure the transaction with smaller price moves and stronger protective conditions.",
        bullets: [
          ctx.urgencyDaysSinceActivity > 14 ? "Idle stretches reduce leverage — safe path limits re-trade risk." : "Momentum is OK; safe package still closes with fewer surprises.",
          ctx.financingStrength !== "strong" ? "Financing uncertainty favors conservative counters and timelines." : "Financing is firmer; safe path still prioritizes binding certainty.",
          marketNote,
        ],
        riskReward: {
          risk: "May concede more price or timing versus aggressive options.",
          reward: "Lower fallout risk; cleaner path to broker-approved documentation.",
        },
      },
      confidenceScore: clamp(baseConfidence - 3, 35, 90),
    },
  ];

  return rows;
}
