/**
 * Deterministic suggestions from aggregated signals — max 5 items; requiresApproval always true.
 */

import type {
  AdaptiveConfidence,
  AdaptiveContext,
  AdaptiveDecision,
  AdaptiveDecisionCategory,
  AdaptiveDecisionPriority,
} from "@/modules/growth/adaptive-intelligence.types";

function slugId(cat: AdaptiveDecisionCategory, idx: number): string {
  return `adpt-${cat}-${idx}`;
}

function inferConfidence(ctx: AdaptiveContext, signalTypes: number): AdaptiveConfidence {
  if (ctx.sparseSignals) return "low";
  if (signalTypes >= 4) return "high";
  if (signalTypes >= 2) return "medium";
  return "low";
}

export function generateAdaptiveDecisions(ctx: AdaptiveContext): AdaptiveDecision[] {
  const out: AdaptiveDecision[] = [];

  const push = (
    cat: AdaptiveDecisionCategory,
    priority: AdaptiveDecisionPriority,
    action: string,
    reason: string,
    signals: string[],
    signalTypes: number,
  ) => {
    const confidence = inferConfidence(ctx, signalTypes);
    out.push({
      id: slugId(cat, out.length),
      category: cat,
      priority,
      action,
      reason,
      supportingSignals: signals.filter(Boolean).slice(0, 8),
      confidence,
      requiresApproval: true,
      whyItMatters:
        "Filled by explainer — correlational advisory only; confirm in CRM before acting.",
    });
  };

  // Timing-first when advisory windows mark critical responsiveness.
  if (ctx.timingUrgencyHint === "critical" && ctx.bestTimingWindow) {
    push(
      "timing",
      "critical",
      "Prioritize responses inside the shortest advisory reply window",
      "Timing optimizer flags a sub-hour / high-urgency response pattern for active leads.",
      [ctx.bestTimingWindow, `Pipeline context: ${ctx.pipelineStatus}`],
      3,
    );
  }

  // Closing: high score + stale touch
  if (ctx.topLead && ctx.topLead.hoursSinceTouch >= 8 && ctx.topLead.score >= 45) {
    const h = Math.round(ctx.topLead.hoursSinceTouch);
    push(
      "closing",
      h >= 48 ? "critical" : "high",
      "Manual follow-up on highest-scored CRM lead before momentum decays",
      `Top scored lead (${ctx.topLead.score}) is at stage “${ctx.topLead.pipelineStage}” with ~${h}h since last record update.`,
      [`score=${ctx.topLead.score}`, `stage=${ctx.topLead.pipelineStage}`, `hours_since_touch≈${h}`, ctx.revenueSignalSummary ?? ""],
      4,
    );
  }

  // Retention / broker dependency
  if (ctx.highestBrokerDependency && ctx.highestBrokerDependency.score >= 0.55) {
    push(
      "retention",
      ctx.highestBrokerDependency.score >= 0.72 ? "high" : "medium",
      "Schedule relationship touchpoints with brokers showing elevated platform reliance indices",
      `Highest observed dependency composite ≈${Math.round(ctx.highestBrokerDependency.score * 100)}% (${ctx.highestBrokerDependency.tier} tier proxy).`,
      ctx.brokerDependencySignals.slice(0, 3),
      3,
    );
  }

  // Growth / geographic demand (FSBO-linked intake only)
  if (ctx.hottestCity && (ctx.hottestCityLeadCount ?? 0) >= 2) {
    push(
      "growth",
      "medium",
      `Review listing + campaign alignment for ${ctx.hottestCity}`,
      `${ctx.hottestCityLeadCount} FSBO-linked CRM leads tied to that city in the last 30d (count-based signal).`,
      [`city=${ctx.hottestCity}`, `fsbo_leads_30d≈${ctx.hottestCityLeadCount}`],
      2,
    );
  }

  // Routing: score headroom + elite tier presence
  if (
    ctx.topLead &&
    ctx.topLead.score >= 72 &&
    ctx.highestBrokerDependency?.tier === "elite"
  ) {
    push(
      "routing",
      "high",
      "When assigning / routing, prefer elite-tier brokers for this high-score intake (manual routing only)",
      "High rule-based score plus presence of at least one elite-tier broker dependency profile in-window.",
      [`lead_score=${ctx.topLead.score}`, `broker_tier_signal=elite`, ctx.executionStatus],
      3,
    );
  }

  // Deal performance / execution measurement (counts only — no broker or lead IDs)
  if (ctx.dealPerformance?.sparseAiTelemetry && ctx.dealPerformance.aiRows <= 8) {
    push(
      "growth",
      "medium",
      "Log more AI execution interactions (copy / local approve) so measurement windows are statistically usable",
      `Deal-performance aggregate shows sparse AI telemetry (${ctx.dealPerformance.aiRows} rows in ${ctx.dealPerformance.windowDays}d window).`,
      [`ai_rows=${ctx.dealPerformance.aiRows}`, "sparse_ai_telemetry=true"],
      3,
    );
  }

  if (
    ctx.dealPerformance &&
    ctx.dealPerformance.brokerRows >= 3 &&
    ctx.dealPerformance.brokerPositiveBands === 0
  ) {
    push(
      "retention",
      "medium",
      "Review broker-side narratives — competition measurement rows show no positive bands in-window",
      `${ctx.dealPerformance.brokerRows} broker comparison rows in ${ctx.dealPerformance.windowDays}d; none classified positive — may be thin data, not necessarily poor performance.`,
      [`broker_rows=${ctx.dealPerformance.brokerRows}`, "broker_positive_bands=0"],
      2,
    );
  }

  if (ctx.revenueForecastInsufficientData && ctx.topLead && ctx.topLead.score >= 55) {
    push(
      "closing",
      "high",
      "Validate pipeline assumptions manually — illustrative revenue forecast flagged insufficient data while a high-scored lead is active",
      `Forecast layer reports insufficient backing data; top CRM score ${ctx.topLead.score} — avoid over-weighting illustrative ranges.`,
      [
        "forecast_insufficient_data=true",
        `lead_score=${ctx.topLead.score}`,
        ctx.revenueForecastConfidence ? `forecast_confidence=${ctx.revenueForecastConfidence}` : "",
      ].filter(Boolean),
      3,
    );
  }

  // Pipeline bottleneck
  if (ctx.weakestStage && ctx.weakestStage.count >= 3) {
    push(
      "growth",
      "medium",
      `Reduce backlog in “${ctx.weakestStage.stage}” stage before adding net-new volume`,
      `Largest early-stage concentration observed at “${ctx.weakestStage.stage}” (${ctx.weakestStage.count} rows).`,
      [`stage=${ctx.weakestStage.stage}`, `count=${ctx.weakestStage.count}`],
      2,
    );
  }

  // Closing psychology axis — only when we already have thin decisions (avoid vague-only state)
  if (out.length < 2 && ctx.closingPsychologyAxis && ctx.topLead && ctx.topLead.score >= 40) {
    push(
      "closing",
      "medium",
      `Prepare honest, human-delivered framing (${ctx.closingPsychologyAxis}) if buyer stalls`,
      "Closing psychology library recommends this axis when velocity or clarity gaps appear — never automated messaging.",
      [`library_axis=${ctx.closingPsychologyAxis}`, `lead_score=${ctx.topLead.score}`],
      2,
    );
  }

  return out;
}
