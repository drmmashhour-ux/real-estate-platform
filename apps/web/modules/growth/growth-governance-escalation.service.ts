/**
 * Human review queue — structured items; no ticketing integration in this phase.
 */

import { growthGovernanceFlags } from "@/config/feature-flags";
import type {
  GrowthGovernanceContext,
  GrowthGovernanceDecision,
  GrowthGovernanceDomain,
  GrowthHumanReviewItem,
} from "./growth-governance.types";

const MAX_ITEMS = 8;

let hrSeq = 0;
function nextHrId(): string {
  hrSeq += 1;
  return `gov-hr-${hrSeq}`;
}

function dedupeItems(items: GrowthHumanReviewItem[]): GrowthHumanReviewItem[] {
  const seen = new Set<string>();
  const out: GrowthHumanReviewItem[] = [];
  for (const x of items) {
    const k = `${x.category}-${x.title.slice(0, 80)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out.slice(0, MAX_ITEMS);
}

/**
 * Builds structured review items when `FEATURE_GROWTH_GOVERNANCE_ESCALATION_V1` is on; otherwise returns [].
 */
export function buildGrowthHumanReviewQueue(
  decision: Pick<GrowthGovernanceDecision, "status" | "topRisks">,
  context?: GrowthGovernanceContext,
): GrowthHumanReviewItem[] {
  if (!growthGovernanceFlags.growthGovernanceEscalationV1) {
    return [];
  }

  hrSeq = 0;
  const items: GrowthHumanReviewItem[] = [];

  if (decision.status === "human_review_required") {
    items.push({
      id: nextHrId(),
      title: "Human review required — governance posture",
      reason: "Escalated status — reconcile CRM capacity, policy, and top risks before scaling.",
      category: "leads",
      severity: "high",
    });
  }

  if (context) {
    if (context.followUpDueNowCount >= 6) {
      items.push({
        id: nextHrId(),
        title: `Due-now follow-up pressure (${context.followUpDueNowCount})`,
        reason: "Multiple items passed due thresholds — prioritize outreach before stacking automation suggestions.",
        category: "leads",
        severity: "high",
      });
    }
    if (context.followUpHighIntentQueued >= 5) {
      items.push({
        id: nextHrId(),
        title: `High-intent follow-up backlog (${context.followUpHighIntentQueued} queued)`,
        reason: "Broker attention needed — internal queue only; no automated outreach.",
        category: "leads",
        severity: context.followUpHighIntentQueued >= 8 ? "high" : "medium",
      });
    }
    if (context.autopilotRejected >= 3) {
      items.push({
        id: nextHrId(),
        title: "Repeated blocked / rejected autopilot actions",
        reason: `${context.autopilotRejected} rejections — align execution policy with suggestions.`,
        category: "autopilot",
        severity: "high",
      });
    }
    if (context.manualOnlyAutopilotCount >= 6 && context.autopilotPending >= 2) {
      items.push({
        id: nextHrId(),
        title: "Manual-only autopilot suggestions backlog",
        reason: "Many manual-only rows pending — clear review queue before adding advisory load.",
        category: "autopilot",
        severity: "medium",
      });
    }
    if (context.weakCampaignDominant && context.campaignsAttributed >= 3) {
      items.push({
        id: nextHrId(),
        title: "Campaign mix concentration risk",
        reason: "One weak campaign dominates — rebalance or pause after human review (no auto spend changes).",
        category: "ads",
        severity: "medium",
      });
    }
    if (context.fusionSnapshotWarnings >= 3) {
      items.push({
        id: nextHrId(),
        title: "Fusion telemetry gaps",
        reason: "Multiple subsystem warnings — confirm data paths before trusting cross-source fusion.",
        category: "fusion",
        severity: "high",
      });
    }
    if (context.adsInsightsProblems.length >= 2) {
      items.push({
        id: nextHrId(),
        title: "Underperforming or weak campaign signals",
        reason: context.adsInsightsProblems.slice(0, 2).join("; "),
        category: "ads",
        severity: "medium",
      });
    }
  }

  for (const r of decision.topRisks) {
    if (r.severity === "high") {
      items.push({
        id: nextHrId(),
        title: r.title,
        reason: r.reason,
        category: r.category as GrowthGovernanceDomain,
        severity: r.severity,
      });
    }
  }

  return dedupeItems(items);
}
