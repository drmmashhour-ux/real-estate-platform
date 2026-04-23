import { createHash } from "crypto";

import { buildExpansionExplanation, thinExpansionDisclaimer } from "@/modules/self-expansion/self-expansion-explainability.service";
import { buildEntryStrategy } from "@/modules/self-expansion/self-expansion-entry-strategy.service";
import { buildPhasePlan } from "@/modules/self-expansion/self-expansion-phasing.service";
import { scoreTerritoryExpansion } from "@/modules/self-expansion/self-expansion-territory-scoring.service";
import type {
  ExpansionCategory,
  ExpansionEffort,
  ExpansionExecutionSafety,
  ExpansionImpactBand,
  ExpansionSignalRef,
  ExpansionUrgency,
  SelfExpansionPlatformContext,
  SelfExpansionRecommendationDraft,
  TerritoryExpansionProfile,
  TerritoryScoreResult,
} from "@/modules/self-expansion/self-expansion.types";
import type { ExpansionLearningWeights } from "@/modules/self-expansion/self-expansion.types";
import type { EntryStrategyResult } from "@/modules/self-expansion/self-expansion.types";
import type { PhasePlanResult } from "@/modules/self-expansion/self-expansion.types";

export function fingerprintExpansion(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 48);
}

function impactBand(score: TerritoryScoreResult["expansionScore"]): ExpansionImpactBand {
  if (score >= 72) return "meaningful";
  if (score >= 52) return "moderate";
  if (score >= 38) return "low";
  return "uncertain_thin_data";
}

function urgencyFrom(score: number, band: string): ExpansionUrgency {
  if (band === "SCALE" || score >= 80) return "critical";
  if (band === "ENTER" || score >= 62) return "high";
  if (band === "PREPARE") return "medium";
  return "low";
}

function effortFrom(hub: string): ExpansionEffort {
  if (hub === "BNHUB" || hub === "RESIDENCE_SERVICES") return "high";
  if (hub === "INVESTOR") return "medium";
  return "medium";
}

function categoryFrom(score: TerritoryScoreResult, territory: TerritoryExpansionProfile): ExpansionCategory {
  if (score.recommendedActionBand === "PAUSE") return "risk_pause";
  if (score.recommendedActionBand === "SCALE") return "scale_win";
  if (territory.supplySignals.ratio < 0.88) return "supply_gap";
  if (territory.demandSignals.buyer + territory.demandSignals.renter > 150) return "demand_surge";
  return "priority_market";
}

function safetyFrom(band: TerritoryScoreResult["recommendedActionBand"]): ExpansionExecutionSafety {
  if (band === "PAUSE") return "NEVER_AUTO";
  if (band === "SCALE" || band === "ENTER") return "APPROVAL_REQUIRED";
  return "ADVISORY_ONLY";
}

function titleFor(p: TerritoryExpansionProfile, entry: EntryStrategyResult, score: TerritoryScoreResult): string {
  const hub = `${entry.entryHub}${entry.secondaryHub ? ` + ${entry.secondaryHub}` : ""}`;
  if (score.recommendedActionBand === "PAUSE") {
    return `Pause heavy spend in ${p.city} until blockers clear`;
  }
  if (score.recommendedActionBand === "PREPARE") {
    return `Prepare ${p.city} for ${hub.replace(/_/g, " ")}-led entry`;
  }
  if (score.recommendedActionBand === "SCALE") {
    return `Scale ${p.city} ${entry.entryHub.replace(/_/g, " ").toLowerCase()} motion`;
  }
  return `Enter ${p.city} with ${hub.replace(/_/g, " ")} first`;
}

function summaryFor(
  p: TerritoryExpansionProfile,
  score: TerritoryScoreResult,
  phase: PhasePlanResult,
  ctx: SelfExpansionPlatformContext
): string {
  return `${p.city} scores ${score.expansionScore}/100 with ${score.recommendedActionBand} band — suggested phase ${phase.currentSuggestedPhase}. ${ctx.aiCeo.executiveRisk === "high" ? "Executive risk elevated; keep expansion spend approval-gated." : "Align cadence with counsel-reviewed regulatory flags."}`;
}

export function buildSignalsForExplanation(
  p: TerritoryExpansionProfile,
  score: TerritoryScoreResult
): ExpansionSignalRef[] {
  return [
    { id: "readiness", label: "Readiness score", value: p.readinessScore, source: "market_domination" },
    { id: "domination", label: "Domination score", value: p.dominationScore, source: "market_domination" },
    { id: "expansionScore", label: "Composite expansion score", value: score.expansionScore, source: "self_expansion.engine" },
    { id: "actionBand", label: "Recommended action band", value: score.recommendedActionBand, source: "self_expansion.scoring" },
    {
      id: "ratio",
      label: "Supply/demand ratio",
      value: p.supplySignals.ratio,
      source: "territory.metrics",
    },
  ];
}

export function buildTerritoryRecommendationDraft(
  p: TerritoryExpansionProfile,
  ctx: SelfExpansionPlatformContext,
  learning: ExpansionLearningWeights | null,
  playbookCompletionPercent?: number | null
): SelfExpansionRecommendationDraft {
  const score = scoreTerritoryExpansion(p, learning);
  const entry = buildEntryStrategy(p);
  const phase = buildPhasePlan({
    territory: p,
    actionBand: score.recommendedActionBand,
    playbookCompletionPercent,
  });

  const signals = buildSignalsForExplanation(p, score);
  const basis = thinExpansionDisclaimer(ctx);
  const explanation = buildExpansionExplanation({
    territory: p,
    signals,
    whyPrioritized: `${p.city} ranks by composite expansion score (${score.expansionScore}) using domination readiness, supply/demand imbalance, and competitor pressure — not a compliance clearance.`,
    whyThisHub: `${entry.entryHub} leads because archetype ${p.archetype} plus bnhub/investor/broker signals favor this wedge; secondary ${entry.secondaryHub ?? "none"}.`,
    majorRisks: entry.expectedRisks,
    phaseRationale: `Phase ${phase.currentSuggestedPhase} matches action band ${score.recommendedActionBand} and readiness ${p.readinessBand}.`,
    dataBasisNote: basis,
  });

  const fingerprint = fingerprintExpansion([p.territoryId, score.recommendedActionBand, entry.entryHub]);

  const phasedPlanSummary = `${phase.currentSuggestedPhase}: ${phase.phaseGoals[0] ?? "Advance playbook"}; exit: ${phase.exitCriteria[0] ?? "n/a"}`;

  return {
    fingerprint,
    territoryId: p.territoryId,
    title: titleFor(p, entry, score),
    category: categoryFrom(score, p),
    summary: summaryFor(p, score, phase, ctx),
    expansionScore: score.expansionScore,
    confidenceScore: score.confidence,
    urgency: urgencyFrom(score.expansionScore, score.recommendedActionBand),
    expectedImpactBand: impactBand(score.expansionScore),
    requiredEffort: effortFrom(entry.entryHub),
    entryHub: entry.entryHub,
    targetSegment: entry.targetSegment,
    phaseSuggested: phase.currentSuggestedPhase,
    recommendationActionBand: score.recommendedActionBand,
    executionSafety: safetyFrom(score.recommendedActionBand),
    phasedPlanSummary,
    firstActions: entry.firstActions,
    expectedRisks: entry.expectedRisks,
    signalsUsed: signals,
    explanation,
    inputSnapshot: {
      generatedAt: ctx.generatedAt,
      territory: p.city,
      archetype: p.archetype,
      readinessBand: p.readinessBand,
      dominationScore: p.dominationScore,
      thinData: ctx.thinDataWarnings,
    },
    entryStrategy: entry,
    phasePlan: phase,
    scoreBreakdown: score,
  };
}

export function generateExpansionRecommendations(
  ctx: SelfExpansionPlatformContext,
  learning: ExpansionLearningWeights | null,
  playbookCompletionByTerritory: Record<string, number | null | undefined>
): SelfExpansionRecommendationDraft[] {
  const drafts: SelfExpansionRecommendationDraft[] = [];
  for (const t of ctx.territories) {
    const pct = playbookCompletionByTerritory[t.territoryId];
    drafts.push(buildTerritoryRecommendationDraft(t, ctx, learning, pct ?? null));
  }
  return [...drafts].sort((a, b) => b.expansionScore - a.expansionScore);
}
