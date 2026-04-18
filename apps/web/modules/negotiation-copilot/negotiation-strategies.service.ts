import type { CanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import type { NegotiationEngineOutput } from "./negotiation.types";

function n(raw: unknown): number {
  const x = Number(String(raw ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(x) ? x : 0;
}

export function runPriceCounterStrategy(ctx: {
  ppMap: Record<string, unknown>;
  deal: CanonicalDealShape;
}): NegotiationEngineOutput | null {
  const price = n(ctx.ppMap["pp.p4.purchasePrice"]) || n(ctx.deal.deal.price?.purchasePrice);
  if (price <= 0) return null;
  const step = Math.max(2500, Math.round(price * 0.005));
  const counter = Math.round(price - step);
  return {
    suggestionType: "counter_offer",
    title: "Modest price counter",
    summary: `Consider a counter near ${counter.toLocaleString("fr-CA")} $ (illustrative step −${step.toLocaleString("fr-CA")} $ vs mapped PP price).`,
    payload: {
      recommendedMove: `Counter at ${counter} $ subject to deed/occupancy alignment`,
      rationale: [
        "Preserves room for inspection/financing dialogue.",
        "Step size is heuristic — adjust to market and client mandate.",
      ],
      tradeoffs: ["May extend negotiation time", "Seller may respond with CP"],
      riskNotes: ["Not legal advice — verify compliance with brokerage instructions."],
      brokerApprovalRequired: true,
    },
    confidence: 0.45,
    impactEstimate: "medium",
    riskLevel: "medium",
  };
}

export function runDepositStructureStrategy(ctx: { ppMap: Record<string, unknown> }): NegotiationEngineOutput | null {
  const dep = n(ctx.ppMap["pp.p4.depositAmount"]);
  if (dep <= 0) return null;
  const stronger = Math.round(dep * 1.15);
  return {
    suggestionType: "deposit_adjustment",
    title: "Strengthen deposit posture",
    summary: `If price is firm, a higher deposit (e.g. ~${stronger.toLocaleString("fr-CA")} $ mapped basis) can signal commitment.`,
    payload: {
      recommendedMove: "Propose increased deposit with unchanged financing window",
      rationale: ["Improves seller comfort without changing price"],
      tradeoffs: ["Buyer liquidity impact"],
      riskNotes: ["Confirm deposit handling with trust/notary workflow"],
      brokerApprovalRequired: true,
    },
    confidence: 0.4,
    impactEstimate: "medium",
    riskLevel: "low",
  };
}

export function runFinancingConditionStrategy(ctx: { ppMap: Record<string, unknown> }): NegotiationEngineOutput {
  return {
    suggestionType: "financing_adjustment",
    title: "Tighten financing clarity",
    summary: "If financing is a flashpoint, pair calendar clarity with lender documentation expectations in CP.",
    payload: {
      recommendedMove: "Ask for financing approval letter timing + narrow waiver window",
      rationale: ["Reduces ambiguity vs open-ended financing"],
      tradeoffs: ["Buyer may resist tighter deadlines"],
      riskNotes: ["Do not remove statutory protections — adjust dates only with counsel as needed"],
      brokerApprovalRequired: true,
    },
    confidence: 0.38,
    impactEstimate: "low",
    riskLevel: "medium",
  };
}

export function runOccupancyTradeoffStrategy(): NegotiationEngineOutput {
  return {
    suggestionType: "occupancy_adjustment",
    title: "Occupancy vs closing date",
    summary: "If occupancy pre-closing is requested, trade for deed date certainty or deposit structure.",
    payload: {
      recommendedMove: "Offer alternate occupancy start with holdback language (draft with broker review)",
      rationale: ["Separates possession risk from title transfer"],
      tradeoffs: ["May require insurance/title nuance"],
      riskNotes: ["High-impact — client-specific"],
      brokerApprovalRequired: true,
    },
    confidence: 0.35,
    impactEstimate: "high",
    riskLevel: "high",
  };
}

export function runInspectionRiskStrategy(): NegotiationEngineOutput {
  return {
    suggestionType: "inspection_adjustment",
    title: "Inspection follow-up",
    summary: "If inspection raised issues, bundle remedial asks instead of one-off nibble.",
    payload: {
      recommendedMove: "Prepare concession bundle referencing inspection report items",
      rationale: ["Cleaner narrative for seller response"],
      tradeoffs: ["Seller may reject bundle wholesale"],
      riskNotes: [],
      brokerApprovalRequired: true,
    },
    confidence: 0.36,
    impactEstimate: "medium",
    riskLevel: "medium",
  };
}

export function runConcessionBundleStrategy(): NegotiationEngineOutput {
  return {
    suggestionType: "concession_bundle",
    title: "Bundle concessions",
    summary: "Combine chattels + minor price + timing in one counter to avoid salami tactics.",
    payload: {
      recommendedMove: "Single CP package with explicit tradeoffs",
      rationale: ["Easier for seller to evaluate holistically"],
      tradeoffs: ["Less flexibility for partial acceptance"],
      riskNotes: [],
      brokerApprovalRequired: true,
    },
    confidence: 0.33,
    impactEstimate: "medium",
    riskLevel: "medium",
  };
}

export function runDeadlinePressureStrategy(ctx: { daysOnMarket?: number | null }): NegotiationEngineOutput | null {
  if (ctx.daysOnMarket == null || ctx.daysOnMarket < 21) return null;
  return {
    suggestionType: "counter_offer",
    title: "Time-on-market awareness",
    summary: "Extended listing exposure may support firmer buyer terms — still client-driven.",
    payload: {
      recommendedMove: "Re-anchor negotiation with data-backed price discussion",
      rationale: ["Market time can affect seller motivation"],
      tradeoffs: ["Emotional seller response"],
      riskNotes: ["Avoid aggressive messaging inconsistent with brokerage standards"],
      brokerApprovalRequired: true,
    },
    confidence: 0.3,
    impactEstimate: "low",
    riskLevel: "low",
  };
}

export function runAllStrategies(input: {
  ppMap: Record<string, unknown>;
  deal: CanonicalDealShape;
  daysOnMarket?: number | null;
}): NegotiationEngineOutput[] {
  const out: NegotiationEngineOutput[] = [];
  const a = runPriceCounterStrategy(input);
  if (a) out.push(a);
  const b = runDepositStructureStrategy(input);
  if (b) out.push(b);
  out.push(runFinancingConditionStrategy(input));
  out.push(runOccupancyTradeoffStrategy());
  out.push(runInspectionRiskStrategy());
  out.push(runConcessionBundleStrategy());
  const d = runDeadlinePressureStrategy({ daysOnMarket: input.daysOnMarket });
  if (d) out.push(d);
  return out;
}
