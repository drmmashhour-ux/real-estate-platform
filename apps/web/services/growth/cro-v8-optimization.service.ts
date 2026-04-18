/**
 * V8-safe CRO optimization — pure analysis + shadow copy.
 * Does not change funnel routing, events, or UX; consumers gate surfacing via feature flags.
 */
import type { FunnelLeak, FunnelLeakStage, FunnelMetrics } from "./funnel-analysis.service";
import { FUNNEL_BENCHMARKS } from "./funnel-analysis.service";
import type {
  CroV8DropoffPoint,
  CroV8ExperimentReadiness,
  CroV8ShadowRecommendation,
} from "./cro-v8-optimization.types";

function severityForGap(gap: number, benchmark: number): CroV8DropoffPoint["severity"] {
  if (gap <= 0) return "info";
  if (gap < benchmark * 0.25) return "watch";
  return "priority";
}

/**
 * Structured drop-off view derived from ratio metrics (diagnostic; does not alter tracking).
 */
export function analyzeCroV8Dropoffs(metrics: FunnelMetrics): CroV8DropoffPoint[] {
  const points: CroV8DropoffPoint[] = [];

  const ctrGap = FUNNEL_BENCHMARKS.CTR - metrics.ctr;
  points.push({
    id: "landing_to_cta",
    fromStep: "landing_view",
    toStep: "cta_click",
    observedRatio: metrics.ctr,
    benchmarkRatio: FUNNEL_BENCHMARKS.CTR,
    gapVsBenchmark: ctrGap,
    severity: severityForGap(ctrGap, FUNNEL_BENCHMARKS.CTR),
    notes:
      ctrGap > 0
        ? ["CTR trail vs benchmark — check creative/audience fit (advisory)."]
        : ["CTR at or above benchmark for this window."],
  });

  const ctlGap = FUNNEL_BENCHMARKS.CLICK_TO_LEAD - metrics.clickToLead;
  points.push({
    id: "cta_to_lead",
    fromStep: "cta_click",
    toStep: "lead_capture",
    observedRatio: metrics.clickToLead,
    benchmarkRatio: FUNNEL_BENCHMARKS.CLICK_TO_LEAD,
    gapVsBenchmark: ctlGap,
    severity: severityForGap(ctlGap, FUNNEL_BENCHMARKS.CLICK_TO_LEAD),
    notes:
      ctlGap > 0
        ? ["Click→lead conversion trails benchmark — form friction or trust (advisory)."]
        : ["Click→lead at or above benchmark."],
  });

  const ltbGap = FUNNEL_BENCHMARKS.LEAD_TO_BOOKING - metrics.leadToBooking;
  points.push({
    id: "lead_to_booking_start",
    fromStep: "lead_capture",
    toStep: "booking_started",
    observedRatio: metrics.leadToBooking,
    benchmarkRatio: FUNNEL_BENCHMARKS.LEAD_TO_BOOKING,
    gapVsBenchmark: ltbGap,
    severity: severityForGap(ltbGap, FUNNEL_BENCHMARKS.LEAD_TO_BOOKING),
    notes:
      ltbGap > 0
        ? ["Lead→booking start trails benchmark — speed-to-lead and nurture (advisory)."]
        : ["Lead→booking start at or above benchmark."],
  });

  const compGap = FUNNEL_BENCHMARKS.COMPLETION - metrics.completionRate;
  points.push({
    id: "booking_start_to_complete",
    fromStep: "booking_started",
    toStep: "booking_completed",
    observedRatio: metrics.completionRate,
    benchmarkRatio: FUNNEL_BENCHMARKS.COMPLETION,
    gapVsBenchmark: compGap,
    severity: severityForGap(compGap, FUNNEL_BENCHMARKS.COMPLETION),
    notes:
      compGap > 0
        ? ["Checkout completion trails benchmark — payment UX or objections (advisory)."]
        : ["Completion at or above benchmark."],
  });

  return points;
}

const DROP_ID_TO_STAGE: Record<string, FunnelLeakStage> = {
  landing_to_cta: "CTR",
  cta_to_lead: "CLICK_TO_LEAD",
  lead_to_booking_start: "LEAD_TO_BOOKING",
  booking_start_to_complete: "COMPLETION",
};

export function buildCroV8ShadowRecommendations(
  leaks: FunnelLeak[],
  dropoffs: CroV8DropoffPoint[],
): CroV8ShadowRecommendation[] {
  const out: CroV8ShadowRecommendation[] = [];
  const leakStages = new Set(leaks.map((l) => l.stage));

  for (const leak of leaks) {
    out.push({
      id: `shadow_leak_${leak.stage}_${leak.severity}`,
      targetStage: leak.stage,
      title: `Shadow CRO test: lift ${leak.stage}`,
      hypothesis: `Model-only: raising ${leak.stage} toward ${leak.benchmarkMin} may improve funnel health; validate with experiments before any live change.`,
      executionMode: "shadow_manual",
    });
  }

  for (const d of dropoffs) {
    if (d.severity !== "priority") continue;
    const stage = DROP_ID_TO_STAGE[d.id];
    if (!stage || leakStages.has(stage)) continue;
    out.push({
      id: `shadow_drop_${d.id}`,
      targetStage: "PORTFOLIO",
      title: `Shadow: reduce drop-off ${d.fromStep}→${d.toStep}`,
      hypothesis: `Observed ratio ${d.observedRatio.toFixed(4)} vs benchmark ${d.benchmarkRatio} — candidate for isolated CRO experiment (not applied).`,
      executionMode: "shadow_manual",
    });
  }

  return dedupeShadow(out);
}

function dedupeShadow(recs: CroV8ShadowRecommendation[]): CroV8ShadowRecommendation[] {
  const seen = new Set<string>();
  const o: CroV8ShadowRecommendation[] = [];
  for (const r of recs) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    o.push(r);
  }
  return o;
}

/** Experiment-ready contract — informational; assignment stays behind AB / product flags. */
export function buildCroV8ExperimentReadiness(): CroV8ExperimentReadiness {
  return {
    version: 1,
    namespace: "cro_v8",
    primaryMetricKeys: ["ctr", "clickToLead", "leadToBooking", "completionRate"],
    hookPoints: [
      {
        id: "capture_landing_to_cta",
        description: "Compare variants on landing→CTA without changing default routing when flags are off.",
        relatedEventKeys: ["landing_view", "cta_click"],
      },
      {
        id: "capture_cta_to_lead",
        description: "Form and trust experiments on CTA→lead (instrument via existing growth events).",
        relatedEventKeys: ["cta_click", "lead_capture"],
      },
      {
        id: "capture_lead_to_booking",
        description: "Nurture / calendar experiments on lead→booking_started.",
        relatedEventKeys: ["lead_capture", "booking_started", "booking_completed"],
      },
    ],
    prerequisites: {
      abTestingSuggested: true,
    },
    disclaimers: [
      "Hooks describe where experiments could attach; they do not enable assignments or redirects.",
      "Pair with FEATURE_AB_TESTING_V1 (or product-owned experiments) before any live UX changes.",
    ],
  };
}
