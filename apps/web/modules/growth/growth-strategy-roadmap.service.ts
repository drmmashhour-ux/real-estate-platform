/**
 * Medium-horizon roadmap themes — guidance only; not implementation orders.
 */

import type {
  GrowthStrategyRoadmapItem,
  GrowthStrategySourceSnapshot,
} from "./growth-strategy.types";

function rid(i: number): string {
  return `road-${i}`;
}

export function buildGrowthStrategyRoadmap(input: GrowthStrategySourceSnapshot): GrowthStrategyRoadmapItem[] {
  const items: GrowthStrategyRoadmapItem[] = [];
  let i = 0;

  const push = (partial: Omit<GrowthStrategyRoadmapItem, "id">) => {
    items.push({ ...partial, id: rid(i) });
    i += 1;
  };

  if (input.adsHealth === "WEAK" || input.executive?.campaignSummary.adsPerformance === "WEAK") {
    push({
      title: "Improve paid acquisition foundation",
      horizon: "this_month",
      theme: "acquisition",
      why: "Campaign band is weak — stabilize measurement and creative before scaling.",
      priority: "high",
    });
  }

  if (input.dueNowCount >= 3 || (input.executive?.leadSummary.dueNow ?? 0) >= 3) {
    push({
      title: "Reduce lead response friction",
      horizon: "next_2_weeks",
      theme: "lead_followup",
      why: "Follow-up backlog suggests routing or capacity tuning this fortnight.",
      priority: "high",
    });
  }

  const gov = input.governance;
  if (gov && (gov.frozenDomains.length > 0 || gov.status === "caution" || gov.status === "watch")) {
    push({
      title: "Strengthen governance before scaling",
      horizon: "this_week",
      theme: "governance",
      why: "Freeze or caution signals — clarify review paths while growth experiments run.",
      priority: "medium",
    });
  }

  if (input.fusionSummary?.grouped.content.length) {
    push({
      title: "Improve content generation workflow quality",
      horizon: "next_2_weeks",
      theme: "content",
      why: "Fusion flagged content signals — align briefs with campaigns incrementally.",
      priority: "medium",
    });
  }

  push({
    title: "Increase follow-up automation quality safely",
    horizon: "this_month",
    theme: "execution",
    why: "Autopilot suggestions remain advisory — tighten human review loops over the month.",
    priority: "medium",
  });

  push({
    title: "Deepen conversion learning without broad CRO refactors",
    horizon: "this_month",
    theme: "conversion",
    why: "Prefer small experiments over core funnel changes — keeps reversibility.",
    priority: "low",
  });

  return items.slice(0, 8);
}
