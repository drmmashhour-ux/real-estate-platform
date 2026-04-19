/**
 * Team-level coaching insights — deterministic, advisory copy.
 */

import type { BrokerTeamInsight, BrokerTeamRow, BrokerTeamSummary } from "./broker-team.types";

export type BrokerTeamInsightsInput = {
  summary: BrokerTeamSummary;
  rows: BrokerTeamRow[];
};

function pushInsight(insights: BrokerTeamInsight[], insight: BrokerTeamInsight): void {
  insights.push(insight);
}

/** Builds coaching-oriented messages from cohort statistics (same inputs ⇒ same outputs). */
export function buildBrokerTeamInsights(input: BrokerTeamInsightsInput): BrokerTeamInsight[] {
  const { summary, rows } = input;
  const insights: BrokerTeamInsight[] = [];

  const avgOverdueRatio =
    rows.length > 0
      ? rows.reduce((a, r) => a + r.followUpsOverdue / Math.max(1, r.leadsAssigned), 0) / rows.length
      : 0;

  const brokersDelayingFollowUps =
    rows.filter((r) => r.leadsAssigned >= 5 && r.followUpsDue >= 3 && r.followUpsOverdue >= 2).length;

  if (brokersDelayingFollowUps >= 2 || avgOverdueRatio >= 0.06) {
    pushInsight(insights, {
      type: "follow_up_culture",
      label: "Follow-up rhythm varies across the team",
      description:
        "Several brokers show elevated overdue follow-up signals relative to assigned volume — usually capacity, clarity, or routing — not intent.",
      severity: avgOverdueRatio >= 0.1 ? "medium" : "low",
      suggestedManagerAction:
        "Offer lightweight prioritization templates (oldest contacted-first) and check workload balance before assuming performance gaps.",
    });
  }

  const activeContactHeavy = rows.filter((r) => r.leadsAssigned >= 8 && r.leadsActive >= 6);
  const lowConv = activeContactHeavy.filter(
    (r) => r.performanceScore >= 62 && r.leadsAssigned > 0 && r.leadsActive / r.leadsAssigned > 0.45,
  );
  if (
    activeContactHeavy.length >= 3 &&
    lowConv.length >= 2 &&
    summary.avgConversionRate < 0.12 &&
    summary.avgPerformanceScore >= 58
  ) {
    pushInsight(insights, {
      type: "conversion_gap",
      label: "Strong motion, conversion still soft",
      description:
        "The team shows healthy activity and pipeline depth, but close outcomes are not rising in step — worth reviewing qualification and next-step clarity.",
      severity: "medium",
      suggestedManagerAction:
        "Run a short win/loss review on recent deals and share one concrete ‘next meeting’ script the team agrees to use.",
    });
  }

  const inactiveCount = summary.inactiveBrokers;
  if (inactiveCount >= 2 && summary.totalBrokers >= 4) {
    pushInsight(insights, {
      type: "capacity_wellness",
      label: "Several brokers are quiet in CRM telemetry",
      description: `${inactiveCount} broker workspace(s) show no recent logged touches — could be leave, tooling gaps, or leads routed outside CRM.`,
      severity: inactiveCount >= 4 ? "medium" : "low",
      suggestedManagerAction:
        "Check in privately: confirm tooling access, reassigned leads, or time off — restore logging habits without public callouts.",
    });
  }

  const topBand = rows.filter((r) => r.band === "elite" || r.band === "strong");
  const decidedWins = rows.reduce((a, r) => {
    /* proxy: score + low overdue as win driver signal */
    return r.band === "elite" || r.band === "strong" ? a + 1 : a;
  }, 0);
  if (summary.totalBrokers >= 5 && topBand.length >= 2 && decidedWins / summary.totalBrokers >= 0.25) {
    pushInsight(insights, {
      type: "recognition",
      label: "Recognize momentum from top execution tiers",
      description:
        "A meaningful slice of the cohort sits in strong execution bands — reinforcement helps others learn behaviors without comparisons that shame.",
      severity: "info",
      suggestedManagerAction:
        "Privately acknowledge consistent habits (follow-up logging, prompt unlock response) and invite optional shadowing — voluntary, not mandatory.",
    });
  }

  return insights;
}
