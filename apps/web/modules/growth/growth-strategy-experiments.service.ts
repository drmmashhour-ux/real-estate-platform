/**
 * Bounded experiment suggestions — planning only; no A/B execution.
 */

import type {
  GrowthStrategyExperiment,
  GrowthStrategySourceSnapshot,
} from "./growth-strategy.types";

const MAX_EXPERIMENTS = 5;
const MIN_EXPERIMENTS = 3;

function id(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

export function buildGrowthStrategyExperiments(
  input: GrowthStrategySourceSnapshot,
): GrowthStrategyExperiment[] {
  const out: GrowthStrategyExperiment[] = [];

  const adsWeak = input.adsHealth === "WEAK";
  const croHint =
    input.fusionSummary?.grouped.cro.some((s) => s.impact === "high") ||
    input.executive?.topRisks.some((r) => /convert|funnel|form|cta/i.test(r));

  if (adsWeak || croHint) {
    out.push({
      id: id("exp", out.length),
      title: "Stronger primary CTA on top landing",
      hypothesis: "A clearer action label reduces hesitation on the main entry path.",
      successMetric: "Early conversion or form-start rate vs baseline week (manual compare).",
      scope: "small",
      ownerHint: "marketing",
      why: "Fusion or executive signals point at conversion friction while acquisition is visible.",
    });
  }

  if (input.fusionSummary?.grouped.ads.length || adsWeak) {
    out.push({
      id: id("exp", out.length),
      title: "Short vs standard ad copy (manual creative test)",
      hypothesis: "Shorter copy improves clarity for cold traffic without changing targeting.",
      successMetric: "CTR or attributed lead rate per campaign (same budget, sequential weeks).",
      scope: "small",
      ownerHint: "growth",
      why: "Ads surface appears in fusion or snapshot; compare copy lengths before scaling spend.",
    });
  }

  if (input.hotLeadCount >= 1 && input.dueNowCount >= 2) {
    out.push({
      id: id("exp", out.length),
      title: "Prioritize high-intent leads in CRM order",
      hypothesis: "Serving hot leads first improves reply-to-meeting rate.",
      successMetric: "Time-to-first-touch for hot tier vs prior week.",
      scope: "medium",
      ownerHint: "sales_ops",
      why: "Follow-up queue and hot lead counts indicate capacity sequencing opportunity.",
    });
  }

  if (input.coordination?.conflicts?.length) {
    out.push({
      id: id("exp", out.length),
      title: "Two outreach variants (tone) — manual A/B",
      hypothesis: "Aligned tone with governance reduces rework on replies.",
      successMetric: "Reply rate or meeting-booked count per variant (manual tracking).",
      scope: "small",
      why: "Agent coordination surfaced conflicts — compare variants offline before automation.",
    });
  }

  out.push({
    id: id("exp", out.length),
    title: "Shorter lead form helper text",
    hypothesis: "Fewer words above the form lowers perceived effort.",
    successMetric: "Form completion rate vs prior period (same traffic level).",
    scope: "small",
    why: "Safe, bounded CRO experiment that does not change pricing or checkout.",
  });

  while (out.length < MIN_EXPERIMENTS && out.length < MAX_EXPERIMENTS) {
    out.push({
      id: id("exp", out.length),
      title: "Weekly review of top UTM campaign messaging",
      hypothesis: "Aligning landing headline with ad promise lifts quality leads.",
      successMetric: "Lead quality score or sales-accepted rate trend.",
      scope: "small",
      why: "Fills experiment slate when other signals are thin — still manual and reversible.",
    });
  }

  return out.slice(0, MAX_EXPERIMENTS);
}
