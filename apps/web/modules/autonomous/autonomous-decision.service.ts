import type {
  AutonomousDecision,
  AutonomousDecisionContext,
  AutonomousSystemState,
} from "./autonomous-marketplace.types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Deterministic advisory decisions — never executes side effects.
 */
export function buildAutonomousDecisions(ctx: AutonomousDecisionContext): AutonomousSystemState {
  const decisions: AutonomousDecision[] = [];

  if (ctx.adsPerforming) {
    decisions.push({
      id: "auto-ads-scale-win",
      domain: "ads",
      action: "Increase budget for winning campaign",
      rationale: [
        "Ads funnel shows captured leads in the measurement window.",
        "Scaling budget is a human action in Ads Manager — this is a draft recommendation only.",
      ],
      confidence: clamp01(0.62 + (ctx.leadCount30d > 50 ? 0.12 : 0)),
      requiresApproval: true,
      impact: "high",
    });
  }

  decisions.push({
    id: "auto-routing-priority",
    domain: "routing",
    action: "Prefer high-confidence routes to elite brokers when policy allows",
    rationale: [
      "Smart Routing V2 + broker tier signals can be aligned (see Broker Competition).",
      "Auto-assign remains off unless product policy explicitly enables high-confidence paths.",
    ],
    confidence: clamp01(0.54),
    requiresApproval: true,
    impact: "medium",
  });

  decisions.push({
    id: "auto-broker-priority",
    domain: "broker",
    action: "Prioritize broker X",
    rationale: [
      "Fusion + broker performance signals favor top closers (see Broker Competition / scale panels).",
      "Routing changes require explicit approval in CRM — no auto-assign.",
    ],
    confidence: clamp01(0.58),
    requiresApproval: true,
    impact: "medium",
  });

  if (ctx.highScoreLeadCount >= 5) {
    decisions.push({
      id: "auto-pricing-demand",
      domain: "pricing",
      action: "Raise pricing on high-demand leads",
      rationale: [
        `High-score lead backlog ≥ ${ctx.highScoreLeadCount} (rule threshold).`,
        "Production pricing is never auto-modified — operator reviews in monetization controls.",
      ],
      confidence: clamp01(0.55 + Math.min(0.2, ctx.highScoreLeadCount / 100)),
      requiresApproval: true,
      impact: "high",
    });
  }

  decisions.push({
    id: "auto-lead-followup",
    domain: "leads",
    action: "Push follow-up for high-intent leads",
    rationale: [
      "Pipeline + scoring indicate contacts worth accelerating.",
      "Messages are draft-only — no auto-send.",
    ],
    confidence: clamp01(0.7),
    requiresApproval: true,
    impact: ctx.governanceRestricted ? "medium" : "high",
  });

  decisions.push({
    id: "auto-conversion-routing",
    domain: "conversion",
    action: "Tune conversion assist prompts",
    rationale: [
      "Funnel + routing V2 signals can inform CRO experiments.",
      "Changes are advisory; roll out via approved experiments only.",
    ],
    confidence: clamp01(0.52),
    requiresApproval: true,
    impact: "low",
  });

  const needsReview = decisions.some((d) => d.requiresApproval && d.impact === "high");
  const status: AutonomousSystemState["status"] = ctx.governanceRestricted
    ? "review_required"
    : needsReview
      ? "review_required"
      : "active";

  return { decisions, status };
}
