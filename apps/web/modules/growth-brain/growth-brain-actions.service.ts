import type { GrowthAction, GrowthOpportunity, ActionRiskLevel } from "./growth-brain.types";
import { uid } from "./growth-brain-signals.service";

function riskFor(domain: GrowthOpportunity["domain"], marketingHeavy: boolean): ActionRiskLevel {
  if (domain === "INVESTOR" || domain === "BNHUB") return "medium";
  if (marketingHeavy) return "medium";
  return domain === "SALES" ? "medium" : "low";
}

function inferSafeAuto(
  opportunity: GrowthOpportunity,
  autonomy: import("./growth-brain.types").GrowthAutonomyLevel
): { autoExecutable: boolean; approvalRequired: boolean } {
  if (autonomy === "OFF") return { autoExecutable: false, approvalRequired: false };
  if (autonomy === "ASSIST") return { autoExecutable: false, approvalRequired: false };
  if (autonomy === "APPROVAL_REQUIRED") return { autoExecutable: false, approvalRequired: true };

  /* SAFE_AUTOPILOT — only bounded, reversible low-risk automation */
  const lowRiskTitle =
    opportunity.category.includes("CONTENT") ||
    opportunity.category.includes("SEO") ||
    opportunity.category.includes("MARKETING EFFICIENCY");

  return {
    autoExecutable: !!lowRiskTitle && opportunity.expectedImpact < 0.72,
    approvalRequired: !(lowRiskTitle && opportunity.expectedImpact < 0.72),
  };
}

function mapOpportunityToActions(
  o: GrowthOpportunity,
  autonomy: import("./growth-brain.types").GrowthAutonomyLevel
): GrowthAction[] {
  const acts: Omit<GrowthAction, "id" | "createdAtIso">[] = [];

  const base = inferSafeAuto(o, autonomy);

  const mk = (
    actionType: GrowthAction["actionType"],
    target: string,
    reason: string,
    outcome: string,
    risk: ActionRiskLevel,
    overrides?: Partial<Pick<GrowthAction, "autoExecutable" | "approvalRequired">>
  ) =>
    acts.push({
      actionType,
      target,
      reason,
      expectedOutcome: outcome,
      riskLevel: risk,
      autoExecutable: overrides?.autoExecutable ?? base.autoExecutable,
      approvalRequired: overrides?.approvalRequired ?? base.approvalRequired,
      opportunityId: o.id,
      sourceSignalIds: o.sourceSignalIds,
    });

  const risk = riskFor(o.domain, o.category.includes("MARKETING"));

  switch (o.domain) {
    case "MARKETING":
      mk(
        "GENERATE_CONTENT",
        "marketing hub & SEO backlog",
        o.whyNow,
        "Adds intent-matched assets to close traffic-to-lead gap.",
        risk
      );
      mk(
        "QUEUE_CONTENT_DRAFT",
        "autonomous marketing queue",
        o.whyNow,
        "Queues drafts for editorial approval — reversible.",
        "low",
        { autoExecutable: autonomy === "SAFE_AUTOPILOT", approvalRequired: autonomy !== "SAFE_AUTOPILOT" }
      );
      break;
    case "SALES":
      mk(
        "SALES_COACHING",
        "AI Sales Manager cohort",
        o.whyNow,
        "Improves objection handling when pipeline conversion is weak.",
        "medium",
        { autoExecutable: false, approvalRequired: true }
      );
      mk(
        "REROUTE_LEADS",
        "routing policy / growth-leads weights",
        o.whyNow,
        "Suggested routing adjustment — logged, reversible routing rules only.",
        "medium",
        { autoExecutable: false, approvalRequired: true }
      );
      break;
    case "BNHUB":
      mk(
        "ACTIVATE_CAMPAIGN",
        "BNHub regional promotion slot",
        o.whyNow,
        "Elevates stays where demand spikes — campaigns require approval if spend attached.",
        "medium",
        { autoExecutable: false, approvalRequired: true }
      );
      break;
    case "INVESTOR":
      mk(
        "GENERATE_CONTENT",
        "investor SEO lane",
        o.whyNow,
        "Feeds investor funnel with rationale-backed articles.",
        "medium",
        { autoExecutable: false, approvalRequired: autonomy !== "SAFE_AUTOPILOT" }
      );
      break;
    case "BROKER":
      mk(
        "ASSIGN_TRAINING",
        "broker skeptic scenarios",
        o.whyNow,
        "Increases close rate via coaching loops — bounded scenarios only.",
        "low",
        { autoExecutable: autonomy === "SAFE_AUTOPILOT", approvalRequired: autonomy !== "SAFE_AUTOPILOT" }
      );
      mk(
        "OUTREACH_PRIORITY",
        "broker acquisition queue",
        o.whyNow,
        "Prioritizes SLA for rising broker intent — human approval for mass outreach.",
        "medium",
        { autoExecutable: false, approvalRequired: true }
      );
      break;
    default:
      mk(
        "APPROVAL_REQUEST",
        "growth leadership review",
        o.whyNow,
        "Opens explainable approval card for nuanced trade-offs.",
        "high",
        { autoExecutable: false, approvalRequired: true }
      );
  }

  return acts.map((a) => ({
    ...a,
    id: uid(),
    createdAtIso: new Date().toISOString(),
  }));
}

/** Top-N opportunities produce bounded action lists (explainable, reversible). */
export function recommendActionsFromOpportunities(
  ranked: GrowthOpportunity[],
  autonomy: import("./growth-brain.types").GrowthAutonomyLevel,
  limit = 8
): GrowthAction[] {
  const slice = ranked.slice(0, limit);
  const out: GrowthAction[] = [];
  for (const o of slice) {
    out.push(...mapOpportunityToActions(o, autonomy));
  }
  return dedupeActions(out);
}

function dedupeActions(actions: GrowthAction[]): GrowthAction[] {
  const seen = new Set<string>();
  const out: GrowthAction[] = [];
  for (const a of actions) {
    const key = `${a.actionType}:${a.target}:${a.opportunityId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}
