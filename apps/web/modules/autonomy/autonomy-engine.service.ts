/**
 * LECIPM autonomy loop — analyze signals, propose improvements, persist, auto-apply safe deltas.
 */
import { prisma } from "@/lib/db";
import {
  computeFunnelRates,
  funnelToPerformanceScore,
  getResidenceFunnelCounts,
  MIN_VIEWS_FOR_PERF,
} from "@/modules/senior-living/matching-events.service";
import {
  estimateMagnitude,
  persistProposals,
  snapshotBaselineMetrics,
  applyDecision,
} from "@/modules/autonomy/autonomy-decision.service";
import type {
  AutonomyDecisionInputs,
  BaselineMetrics,
  GeneratedDecisionDraft,
  ResidenceRankingSignal,
} from "@/modules/autonomy/autonomy-types";

const RES_BATCH = 80;

async function residenceSignals(): Promise<{
  baseline: BaselineMetrics;
  leadRule: AutonomyDecisionInputs["leadRule"];
  signals: ResidenceRankingSignal[];
  gtmOnboardingEvents30d: number;
}> {
  const baseline = await snapshotBaselineMetrics();

  const thirty = new Date();
  thirty.setDate(thirty.getDate() - 30);

  const [rule, residences, gtmCount] = await Promise.all([
    prisma.lecipmMarketPricingRule.findUnique({ where: { type: "LEAD" } }),
    prisma.seniorResidence.findMany({
      select: { id: true },
      take: RES_BATCH,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.seniorLivingGtmExecutionEvent.count({
      where: { occurredAt: { gte: thirty } },
    }),
  ]);

  const leadRule = {
    basePrice: rule?.basePrice ?? 49,
    minPrice: rule?.minPrice ?? 29,
    maxPrice: rule?.maxPrice ?? 149,
    demandFactor: rule?.demandFactor ?? 1,
    qualityFactor: rule?.qualityFactor ?? 1,
  };

  const signals: ResidenceRankingSignal[] = [];
  for (const r of residences) {
    const funnel = await getResidenceFunnelCounts(r.id);
    const { conversionRate } = computeFunnelRates(funnel);
    const performanceScore = funnelToPerformanceScore(funnel);
    signals.push({
      residenceId: r.id,
      performanceScore,
      views: funnel.views,
      conversionRate,
    });
  }

  return { baseline, leadRule, signals, gtmOnboardingEvents30d: gtmCount };
}

function topByPerformance(signals: ResidenceRankingSignal[], n: number): ResidenceRankingSignal[] {
  return [...signals].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, n);
}

function lowVisibilityHighConverters(signals: ResidenceRankingSignal[]): ResidenceRankingSignal[] {
  return signals.filter(
    (s) =>
      s.performanceScore >= 62 &&
      s.views >= MIN_VIEWS_FOR_PERF &&
      s.views < MIN_VIEWS_FOR_PERF * 3 &&
      s.conversionRate >= 0.06
  );
}

export async function gatherDecisionInputs(): Promise<AutonomyDecisionInputs> {
  const { baseline, leadRule, signals, gtmOnboardingEvents30d } = await residenceSignals();

  return {
    baseline,
    leadRule,
    topByPerformance: topByPerformance(signals, 8),
    lowVisibilityHighConverter: lowVisibilityHighConverters(signals),
    gtmOnboardingEvents30d,
  };
}

/**
 * Detect inefficiencies and propose bounded improvements (no execution here).
 */
export function generateDecisions(inputs: AutonomyDecisionInputs): GeneratedDecisionDraft[] {
  const out: GeneratedDecisionDraft[] = [];
  const { baseline, leadRule } = inputs;

  if (
    baseline.leadVolume30d >= 12 &&
    baseline.seniorConversionRate30d < 0.07 &&
    baseline.avgLeadScore != null &&
    baseline.avgLeadScore < 44
  ) {
    const draft: GeneratedDecisionDraft = {
      domain: "MATCHING",
      action: "nudge_lead_scoring_engagement",
      rationale: `Lead volume is healthy (${baseline.leadVolume30d} / 30d) but average score (${baseline.avgLeadScore.toFixed(1)}) and conversion (${(baseline.seniorConversionRate30d * 100).toFixed(1)}%) are weak — slightly increase engagement weight in the scoring mix.`,
      confidence: 0.72,
      impactEstimate: 0.04,
      magnitude: 0,
      payload: {
        kind: "adjust_lead_scoring_weights",
        deltas: { wEngagement: 0.018, wBudget: -0.006, wCare: -0.006, wIntent: -0.003, wSource: -0.003 },
      },
    };
    draft.magnitude = estimateMagnitude(draft.payload);
    out.push(draft);
  }

  if (leadRule.demandFactor < 0.96 && baseline.demandIndex > 0.52 && baseline.leadVolume30d >= 8) {
    const rel = 0.028;
    const draft: GeneratedDecisionDraft = {
      domain: "PRICING",
      action: "increase_lead_base_price",
      rationale: `Demand index ${baseline.demandIndex.toFixed(2)} supports a modest LEAD reference increase while staying inside min/max bands.`,
      confidence: 0.68,
      impactEstimate: rel,
      magnitude: rel,
      payload: { kind: "adjust_lead_base_price", relativeDelta: rel },
    };
    out.push(draft);
  }

  if (
    inputs.lowVisibilityHighConverter.length >= 2 &&
    baseline.matchingEventsTotal >= 120
  ) {
    const ids = inputs.lowVisibilityHighConverter.slice(0, 8).map((x) => x.residenceId);
    const pts = 2;
    const draft: GeneratedDecisionDraft = {
      domain: "RANKING",
      action: "boost_high_performers",
      rationale: `${ids.length} residences convert well relative to visibility — small rank boost points to surface them.`,
      confidence: 0.7,
      impactEstimate: 0.03,
      magnitude: 0,
      payload: { kind: "boost_residence_rank", residenceIds: ids, deltaPoints: pts },
    };
    draft.magnitude = estimateMagnitude(draft.payload);
    out.push(draft);
  }

  if (
    inputs.gtmOnboardingEvents30d < 8 &&
    baseline.leadVolume30d > 18 &&
    baseline.seniorConversionRate30d < 0.09
  ) {
    const draft: GeneratedDecisionDraft = {
      domain: "GROWTH",
      action: "emphasize_operator_onboarding",
      rationale: `GTM execution volume is low versus lead inflow — log a structured emphasis shift toward operator onboarding (human approval required).`,
      confidence: 0.61,
      impactEstimate: 0.06,
      magnitude: 1,
      payload: {
        kind: "gtm_onboarding_emphasis",
        emphasis: "operator_outreach",
        note: "Autonomy proposal: prioritize operator onboarding touches to lift downstream conversion.",
      },
    };
    draft.magnitude = estimateMagnitude(draft.payload);
    out.push(draft);
  }

  if (
    baseline.matchingEventsTotal >= 200 &&
    baseline.seniorConversionRate30d >= 0.07 &&
    baseline.seniorConversionRate30d < 0.11
  ) {
    const draft: GeneratedDecisionDraft = {
      domain: "MATCHING",
      action: "nudge_matching_dimension_weights",
      rationale: `Healthy funnel volume (${baseline.matchingEventsTotal} events) — small lift to location vs budget emphasis to improve discovery-to-intent alignment.`,
      confidence: 0.66,
      impactEstimate: 0.025,
      magnitude: 0,
      payload: {
        kind: "adjust_matching_weights",
        deltas: { care: 0.006, budget: -0.006, location: 0.01, service: -0.01 },
      },
    };
    draft.magnitude = estimateMagnitude(draft.payload);
    out.push(draft);
  }

  return out;
}

async function dedupeDrafts(drafts: GeneratedDecisionDraft[]): Promise<GeneratedDecisionDraft[]> {
  if (drafts.length === 0) return [];
  const since = new Date(Date.now() - 48 * 3600 * 1000);
  const recent = await prisma.autonomyDecision.findMany({
    where: {
      createdAt: { gte: since },
      status: { in: ["PROPOSED", "APPROVED"] },
    },
    select: { domain: true, action: true },
  });
  const keys = new Set(recent.map((r) => `${r.domain}:${r.action}`));
  return drafts.filter((d) => !keys.has(`${d.domain}:${d.action}`));
}

export type AutonomyCycleResult = {
  proposals: number;
  persistedIds: string[];
  autoApplied: number;
  skippedDeduped: number;
};

/**
 * Full 24h-style cycle: analyze → persist → validate+apply when guardrails allow.
 */
export async function runAutonomyCycle(): Promise<AutonomyCycleResult> {
  const inputs = await gatherDecisionInputs();
  const drafts = generateDecisions(inputs);
  const fresh = await dedupeDrafts(drafts);
  const skippedDeduped = drafts.length - fresh.length;

  const { createdIds } = await persistProposals(fresh, inputs.baseline);

  let autoApplied = 0;
  for (const id of createdIds) {
    const row = await prisma.autonomyDecision.findUnique({
      where: { id },
      select: { requiresApproval: true, status: true },
    });
    if (!row || row.status !== "PROPOSED") continue;
    if (row.requiresApproval) continue;

    try {
      await applyDecision(id);
      autoApplied += 1;
    } catch {
      /* leave PROPOSED for manual review */
    }
  }

  return {
    proposals: fresh.length,
    persistedIds: createdIds,
    autoApplied,
    skippedDeduped,
  };
}
