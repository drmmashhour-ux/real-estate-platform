import { engineFlags } from "@/config/feature-flags";
import type { OfferActionRecommendation, OfferStrategyContext, OfferStrategyOutput } from "@/modules/offer-strategy/offer-strategy.types";
import type {
  CloseBlocker,
  DealCloserContext,
  DealCloserOutput,
  NextCloseAction,
} from "@/modules/deal-closer/deal-closer.types";
import type { NegotiationScenario } from "@/modules/negotiation-simulator/negotiation-simulator.types";
import type { NegotiationSimulatorContext, NegotiationSimulatorOutput } from "@/modules/negotiation-simulator/negotiation-simulator.types";
import { selectStrategyWithReinforcement } from "./reinforcement.engine";
import type { ReinforcementCandidate, ReinforcementContextInput } from "./reinforcement.types";
import { normalizeContextInput } from "./context-bucket.service";
import type { StrategyBenchmarkDomain } from "@prisma/client";

const PRI: Record<OfferActionRecommendation["priority"], number> = { high: 0.9, medium: 0.62, low: 0.35 };

/**
 * Map offer recs to bandit candidates (no blocking here — product engines stay authoritative).
 */
export function offerRecsToCandidates(recs: OfferActionRecommendation[]): ReinforcementCandidate[] {
  return recs.map((r) => ({
    strategyKey: r.key,
    baseScore: PRI[r.priority] ?? 0.5,
    blocked: false,
  }));
}

function blockerOpenKeys(blockers: CloseBlocker[]): Set<string> {
  return new Set(blockers.map((b) => b.key));
}

export function closerActionsToCandidates(actions: NextCloseAction[], blockers: CloseBlocker[]): ReinforcementCandidate[] {
  const open = blockerOpenKeys(blockers);
  return actions.map((a, i) => ({
    strategyKey: a.key,
    baseScore: Math.max(0.2, 0.92 - i * 0.04),
    blocked: (a.blockedIf ?? []).some((k) => open.has(k)),
  }));
}

export function negotiationScenariosToCandidates(scenarios: NegotiationScenario[]): ReinforcementCandidate[] {
  return scenarios.map((s) => ({
    strategyKey: s.approachKey,
    baseScore: Math.max(0.1, Math.min(0.95, s.confidence)),
    blocked: false,
  }));
}

export function contextFromOfferStrategy(osc: OfferStrategyContext, out: OfferStrategyOutput): ReinforcementContextInput {
  const orBand =
    out.readiness.label === "not_ready"
      ? "low"
      : out.readiness.label === "discussion_ready"
        ? "mid"
        : "high";
  const sev: ReinforcementContextInput["objectionSeverity"] = (() => {
    const b = out.blockers.filter((x) => x.severity === "high");
    if (b.length) return "high";
    if (out.blockers.some((x) => x.severity === "medium")) return "medium";
    if (out.blockers.length) return "low";
    return "none";
  })();
  return normalizeContextInput({
    dealStage: osc.dealStatus ?? "unknown",
    offerReadinessBand: orBand,
    financingReadiness: osc.financingReadiness,
    urgency: osc.urgencyLevel,
    objectionSeverity: sev,
    competitionRisk: out.competitiveRisk.level,
    visitCompleted: osc.visitCompleted ?? null,
    silenceGapDays: osc.silenceGapDays ?? null,
    engagementScore: osc.engagementScore,
  });
}

function bandFrom01(n: number | null | undefined, mode: "offer" | "close"): "low" | "mid" | "high" | "unknown" {
  if (typeof n !== "number" || !Number.isFinite(n)) return "unknown";
  const t = n > 1 ? n / 100 : n;
  if (mode === "close") {
    if (t < 0.35) return "low";
    if (t < 0.7) return "mid";
    return "high";
  }
  const t2 = t;
  if (t2 < 0.35) return "low";
  if (t2 < 0.7) return "mid";
  return "high";
}

export function contextFromDealCloser(ctx: DealCloserContext, out: DealCloserOutput): ReinforcementContextInput {
  const obj: ReinforcementContextInput["objectionSeverity"] = out.blockers.some((b) => b.severity === "high")
    ? "high"
    : out.blockers.some((b) => b.severity === "medium")
      ? "medium"
      : out.blockers.length
        ? "low"
        : "none";
  const crb =
    out.readiness.label === "close_ready" || out.readiness.label === "high_intent" ? "high" : out.readiness.label === "warming_up" ? "mid" : "low";
  return normalizeContextInput({
    dealStage: ctx.crmStage ?? ctx.dealStage ?? ctx.dealStatus,
    closingReadinessBand: crb,
    financingReadiness: ctx.financingReadiness,
    urgency: ctx.urgencyLevel,
    objectionSeverity: obj,
    competitionRisk: "unknown",
    visitCompleted: ctx.visitScheduled === true,
    silenceGapDays: ctx.silenceGapDays,
    engagementScore: ctx.engagementScore,
  });
}

export function contextFromNegotiation(nctx: NegotiationSimulatorContext): ReinforcementContextInput {
  const orB = bandFrom01(nctx.offerReadinessScore ?? null);
  const crB = bandFrom01(nctx.closingReadinessScore ?? null);
  const sev: ReinforcementContextInput["objectionSeverity"] = (() => {
    if (!nctx.objections) return "unknown";
    if (Array.isArray(nctx.objections) && nctx.objections.length >= 3) return "high";
    if (Array.isArray(nctx.objections) && nctx.objections.length) return "medium";
    if (nctx.objections && typeof nctx.objections === "object" && "objections" in nctx.objections) {
      const a = (nctx.objections as { objections?: unknown[] }).objections;
      if (Array.isArray(a) && a.length >= 2) return "high";
    }
    return "low";
  })();
  return normalizeContextInput({
    dealStage: nctx.dealId ? "active_deal" : "unknown",
    offerReadinessBand: orB,
    closingReadinessBand: crB,
    financingReadiness: nctx.financingReadiness,
    urgency: nctx.urgencyLevel,
    objectionSeverity: sev,
    competitionRisk: nctx.competitiveRisk,
    visitCompleted: nctx.visitCompleted,
    silenceGapDays: nctx.silenceGapDays,
    engagementScore: nctx.engagementScore,
  });
}

/**
 * Reorders offer strategy recommendations; returns null if feature off or no candidates.
 */
export async function maybeApplyReinforcementToOffer(
  domain: StrategyBenchmarkDomain,
  osc: OfferStrategyContext,
  out: OfferStrategyOutput
): Promise<OfferStrategyOutput> {
  if (!engineFlags.reinforcementLayerV1 || out.recommendations.length === 0) return out;
  try {
    const candidates = offerRecsToCandidates(out.recommendations);
    const context = contextFromOfferStrategy(osc, out);
    const sel = await selectStrategyWithReinforcement({
      domain,
      candidates,
      context,
      dealId: osc.dealId ?? null,
      conversationId: osc.conversationId,
      brokerId: osc.brokerId,
    });
    const byKey = new Map(out.recommendations.map((r) => [r.key, r]));
    const ordered: OfferActionRecommendation[] = [];
    for (const a of sel.adjustedRanking) {
      const o = byKey.get(a.strategyKey);
      if (o) ordered.push(o);
    }
    for (const r of out.recommendations) {
      if (!ordered.find((x) => x.key === r.key)) ordered.push(r);
    }
    return {
      ...out,
      recommendations: ordered,
      reinforcement: {
        topKey: sel.strategyKey,
        selectionMode: sel.selectionMode,
        contextBucket: sel.contextBucket,
        adjustedRanking: sel.adjustedRanking,
        rationale: sel.rationale,
        decisionId: sel.decisionId,
      },
    };
  } catch {
    return out;
  }
}

export async function maybeApplyReinforcementToCloser(ctx: DealCloserContext, out: DealCloserOutput): Promise<DealCloserOutput> {
  if (!engineFlags.reinforcementLayerV1 || out.nextActions.length === 0) return out;
  try {
    const candidates = closerActionsToCandidates(out.nextActions, out.blockers);
    if (candidates.filter((c) => !c.blocked).length === 0) return out;
    const context = contextFromDealCloser(ctx, out);
    const sel = await selectStrategyWithReinforcement({
      domain: "CLOSING",
      candidates,
      context,
      dealId: ctx.dealId,
      conversationId: ctx.conversationId,
      brokerId: ctx.brokerId,
    });
    const byK = new Map(out.nextActions.map((a) => [a.key, a]));
    const ord: NextCloseAction[] = [];
    for (const a of sel.adjustedRanking) {
      const o = byK.get(a.strategyKey);
      if (o) ord.push(o);
    }
    for (const a of out.nextActions) {
      if (!ord.find((x) => x.key === a.key)) ord.push(a);
    }
    return {
      ...out,
      nextActions: ord,
      reinforcement: {
        topKey: sel.strategyKey,
        selectionMode: sel.selectionMode,
        contextBucket: sel.contextBucket,
        adjustedRanking: sel.adjustedRanking,
        rationale: sel.rationale,
        decisionId: sel.decisionId,
      },
    };
  } catch {
    return out;
  }
}

export async function maybeApplyReinforcementToNegotiation(
  nctx: NegotiationSimulatorContext,
  base: NegotiationSimulatorOutput
): Promise<NegotiationSimulatorOutput> {
  if (!engineFlags.reinforcementLayerV1 || base.scenarios.length === 0) return base;
  try {
    const candidates = negotiationScenariosToCandidates(base.scenarios);
    const context = contextFromNegotiation(nctx);
    const sel = await selectStrategyWithReinforcement({
      domain: "NEGOTIATION",
      candidates,
      context,
      dealId: nctx.dealId,
      conversationId: nctx.conversationId,
      brokerId: nctx.brokerId,
    });
    const byK = new Map(base.scenarios.map((s) => [s.approachKey, s]));
    const ord: import("@/modules/negotiation-simulator/negotiation-simulator.types").NegotiationScenario[] = [];
    for (const a of sel.adjustedRanking) {
      const o = byK.get(a.strategyKey);
      if (o) ord.push(o);
    }
    for (const s of base.scenarios) {
      if (!ord.find((x) => x.approachKey === s.approachKey)) ord.push(s);
    }
    return {
      ...base,
      scenarios: ord,
      reinforcement: {
        topKey: sel.strategyKey,
        selectionMode: sel.selectionMode,
        contextBucket: sel.contextBucket,
        adjustedRanking: sel.adjustedRanking,
        rationale: sel.rationale,
        decisionId: sel.decisionId,
      },
    };
  } catch {
    return base;
  }
}
