/**
 * Read-only governance evaluation — deterministic rules, no mutations.
 */

import { prisma } from "@/lib/db";
import {
  aiAutopilotContentAssistFlags,
  aiAutopilotMessagingAssistFlags,
  growthFusionFlags,
  growthGovernanceFlags,
} from "@/config/feature-flags";
import { buildAutopilotActions } from "./ai-autopilot.service";
import { getAutopilotActionStatus } from "./ai-autopilot-approval.service";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "./ai-autopilot-followup.service";
import {
  computePaidFunnelAdsInsights,
  fetchEarlyConversionAdsSnapshot,
  type EarlyConversionAdsSnapshot,
} from "./growth-ai-analyzer.service";
import { analyzeGrowthFusion } from "./growth-fusion-analyzer.service";
import { buildGrowthFusionSnapshot } from "./growth-fusion-snapshot.service";
import { buildGrowthHumanReviewQueue } from "./growth-governance-escalation.service";
import { getGrowthFreezeState } from "./growth-governance-freeze.service";
import {
  logGrowthGovernanceEvaluationStarted,
  recordGrowthGovernanceEvaluation,
} from "./growth-governance-monitoring.service";
import type {
  GrowthGovernanceContext,
  GrowthGovernanceDecision,
  GrowthGovernanceDomain,
  GrowthGovernanceSignal,
  GrowthGovernanceStatus,
} from "./growth-governance.types";

let signalSeq = 0;
function nextId(prefix: string): string {
  signalSeq += 1;
  return `gov-${prefix}-${signalSeq}`;
}

function pushSignal(
  out: GrowthGovernanceSignal[],
  partial: Omit<GrowthGovernanceSignal, "id"> & { id?: string },
): void {
  out.push({
    id: partial.id ?? nextId(partial.category),
    category: partial.category,
    severity: partial.severity,
    title: partial.title,
    description: partial.description,
    reason: partial.reason,
  });
}

function pickStatus(
  signals: GrowthGovernanceSignal[],
  hints: { hr: boolean; freeze: boolean; watch: boolean; caution: boolean },
): GrowthGovernanceStatus {
  const high = signals.filter((s) => s.severity === "high").length;
  if (hints.hr || high >= 3) return "human_review_required";
  if (hints.freeze) return "freeze_recommended";
  if (hints.caution) return "caution";
  if (hints.watch) return "watch";
  return "healthy";
}

/**
 * Aggregates read-only signals and returns a single governance decision.
 * Returns `null` when `FEATURE_GROWTH_GOVERNANCE_V1` is off.
 */
export async function evaluateGrowthGovernance(): Promise<GrowthGovernanceDecision | null> {
  if (!growthGovernanceFlags.growthGovernanceV1) {
    return null;
  }

  signalSeq = 0;
  logGrowthGovernanceEvaluationStarted();
  const governanceWarnings: string[] = [];
  const signals: GrowthGovernanceSignal[] = [];

  let early: EarlyConversionAdsSnapshot | null = null;
  let adsInsightsProblems: string[] = [];
  let adsHealth: "STRONG" | "OK" | "WEAK" = "WEAK";
  try {
    early = await fetchEarlyConversionAdsSnapshot();
    const ins = computePaidFunnelAdsInsights(early);
    adsInsightsProblems = ins.problems;
    adsHealth = ins.health;
  } catch {
    governanceWarnings.push("early_conversion_unavailable");
  }

  const leadsToday = early?.leadsToday ?? 0;
  const totalEarly = early?.totalLeads ?? 0;
  const campaignsAttributed = early?.campaignCounts.filter((c) => c.label !== "(no UTM)").length ?? 0;
  const top = early?.topCampaign;
  const attributedTotal = early?.leadsWithUtmCampaign ?? 0;
  let weakCampaignDominant = false;
  if (top && attributedTotal >= 4) {
    const share = top.count / attributedTotal;
    weakCampaignDominant = share >= 0.5 && top.count < 5;
  }

  let autopilotRejected = 0;
  let autopilotPending = 0;
  let manualOnlyCount = 0;
  try {
    const acts = buildAutopilotActions();
    for (const a of acts) {
      const st = getAutopilotActionStatus(a.id);
      if (st === "rejected") autopilotRejected += 1;
      if (st === "pending") autopilotPending += 1;
      if (a.executionMode === "manual_only") manualOnlyCount += 1;
    }
  } catch {
    governanceWarnings.push("autopilot_unavailable");
  }

  let followUpHighIntentQueued = 0;
  let followUpDueNowCount = 0;
  try {
    const rows = await prisma.lead.findMany({
      take: 200,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
        aiScore: true,
        aiPriority: true,
        aiTags: true,
        lastContactedAt: true,
        launchSalesContacted: true,
        launchLastContactDate: true,
        pipelineStatus: true,
        aiExplanation: true,
      },
    });
    const q = buildFollowUpQueue(rows.map(leadRowToFollowUpInput));
    followUpDueNowCount = q.filter((i) => i.status === "due_now").length;
    followUpHighIntentQueued = q.filter(
      (i) => i.queueScore >= 72 && (i.status === "queued" || i.status === "due_now"),
    ).length;
  } catch {
    governanceWarnings.push("followup_queue_unavailable");
  }

  let fusionSummaryStatus: "weak" | "moderate" | "strong" | null = null;
  let fusionSnapshotWarnings = 0;
  if (growthFusionFlags.growthFusionV1) {
    try {
      const snap = await buildGrowthFusionSnapshot();
      fusionSnapshotWarnings = snap.warnings.length;
      const summary = analyzeGrowthFusion(snap);
      fusionSummaryStatus = summary.status;
      if (summary.status === "weak") {
        pushSignal(signals, {
          category: "fusion",
          severity: "medium",
          title: "Fusion summary is weak",
          description: "Cross-source confidence is low or signals conflict.",
          reason: "Pause advisory scaling until sources stabilize.",
        });
      }
    } catch {
      governanceWarnings.push("fusion_unavailable");
    }
  }

  /** UTM / campaign rules */
  if (campaignsAttributed > 0 && leadsToday === 0 && totalEarly >= 3) {
    pushSignal(signals, {
      category: "ads",
      severity: "low",
      title: "No early-conversion leads today with active campaign history",
      description: "Attributed campaigns exist in the landing funnel snapshot but no leads today.",
      reason: "Watch intraday variance before changing strategy.",
    });
  }

  if (adsInsightsProblems.length > 0) {
    pushSignal(signals, {
      category: "ads",
      severity: adsInsightsProblems.length >= 2 ? "medium" : "low",
      title: "Campaign underperformance signals",
      description: adsInsightsProblems.slice(0, 3).join("; "),
      reason: "Review creative and targeting manually — governance does not alter spend.",
    });
  }

  if (weakCampaignDominant) {
    pushSignal(signals, {
      category: "ads",
      severity: "medium",
      title: "Dominant campaign concentration risk",
      description: "One campaign takes a large share while remaining thin vs benchmarks.",
      reason: "Diversify after human review — avoid automated reallocation.",
    });
  }

  /** Autopilot */
  if (autopilotRejected >= 3) {
    pushSignal(signals, {
      category: "autopilot",
      severity: "high",
      title: "Multiple rejected autopilot actions",
      description: `${autopilotRejected} actions are in rejected state.`,
      reason: "Policy mismatch or operator disagreement — needs human reconciliation.",
    });
  } else if (autopilotRejected >= 1) {
    pushSignal(signals, {
      category: "autopilot",
      severity: "low",
      title: "Some autopilot rows rejected",
      description: `${autopilotRejected} rejected action(s) on file.`,
      reason: "Confirm execution policy alignment.",
    });
  }

  if (manualOnlyCount >= 5 && autopilotPending >= 3) {
    pushSignal(signals, {
      category: "autopilot",
      severity: "medium",
      title: "Manual-only backlog vs pending approvals",
      description: "Several manual-only suggestions coexist with pending approvals.",
      reason: "Clear queue discipline before adding new advisory work.",
    });
  }

  /** Follow-up */
  if (followUpHighIntentQueued >= 8) {
    pushSignal(signals, {
      category: "leads",
      severity: "high",
      title: "High-intent follow-up queue pressure",
      description: `${followUpHighIntentQueued} high-score items queued or due.`,
      reason: "Broker capacity risk — escalate review before automation suggestions stack.",
    });
  } else if (followUpHighIntentQueued >= 5) {
    pushSignal(signals, {
      category: "leads",
      severity: "medium",
      title: "Follow-up queue attention",
      description: `${followUpHighIntentQueued} high-score queued items.`,
      reason: "Prioritize human outreach — internal queue only.",
    });
  }

  /** Conflicting cross signals */
  if (
    fusionSummaryStatus === "moderate" &&
    adsHealth === "WEAK" &&
    leadsToday === 0 &&
    totalEarly >= 10
  ) {
    pushSignal(signals, {
      category: "fusion",
      severity: "medium",
      title: "Conflicting health: fusion vs ads velocity",
      description: "Fusion is middling while UTM early leads are cold today.",
      reason: "Treat scaling ideas as advisory until alignment improves.",
    });
  }

  if (fusionSnapshotWarnings >= 3) {
    pushSignal(signals, {
      category: "fusion",
      severity: "high",
      title: "Weak telemetry coverage for fusion inputs",
      description: `${fusionSnapshotWarnings} subsystem warnings while building fusion snapshot.`,
      reason: "Freeze advisory automation suggestions until data paths recover.",
    });
  }

  const hints = {
    hr:
      autopilotRejected >= 3 ||
      followUpHighIntentQueued >= 8 ||
      followUpDueNowCount >= 6 ||
      fusionSnapshotWarnings >= 4 ||
      (manualOnlyCount >= 6 && autopilotPending >= 2),
    freeze:
      fusionSnapshotWarnings >= 3 ||
      (fusionSummaryStatus === "weak" && fusionSnapshotWarnings >= 2) ||
      (adsInsightsProblems.length >= 3 && totalEarly >= 8) ||
      (fusionSummaryStatus === "weak" && adsHealth === "WEAK" && leadsToday === 0),
    watch: campaignsAttributed > 0 && leadsToday === 0 && totalEarly >= 3,
    caution:
      weakCampaignDominant ||
      adsInsightsProblems.length >= 2 ||
      followUpHighIntentQueued >= 5 ||
      adsInsightsProblems.length >= 3,
  };

  const status = pickStatus(signals, hints);

  const topRisksSorted = [...signals].sort((a, b) => {
    const o = { high: 2, medium: 1, low: 0 };
    return o[b.severity] - o[a.severity];
  });
  const topRisks = topRisksSorted.slice(0, 3);

  const rawBlocked: GrowthGovernanceDomain[] = [];
  if (autopilotRejected >= 3) rawBlocked.push("autopilot");
  if (adsInsightsProblems.length >= 2) rawBlocked.push("ads");
  if (followUpHighIntentQueued >= 8) rawBlocked.push("leads");
  if (manualOnlyCount >= 6 && autopilotPending >= 2) rawBlocked.push("autopilot");

  let blockedDomains = [...new Set(rawBlocked)];

  if (status === "human_review_required" && !blockedDomains.includes("autopilot")) {
    blockedDomains.push("autopilot");
  }

  if (status === "freeze_recommended") {
    for (const dom of ["ads", "cro", "content", "fusion"] as GrowthGovernanceDomain[]) {
      if (!blockedDomains.includes(dom)) blockedDomains.push(dom);
    }
  }

  const notes: string[] = [];
  if (aiAutopilotContentAssistFlags.contentAssistV1) {
    notes.push("Content assist is enabled — drafts remain review-first.");
  } else {
    notes.push("Content assist off — fewer automated copy paths.");
  }
  if (aiAutopilotMessagingAssistFlags.messagingAssistV1) {
    notes.push("Messaging assist enabled — outbound still manual per policy.");
  }
  notes.push("Governance is advisory; source systems and approvals remain authoritative.");

  const ctx: GrowthGovernanceContext = {
    leadsToday,
    totalEarlyConversionLeads: totalEarly,
    campaignsAttributed,
    adsInsightsProblems,
    adsHealth,
    weakCampaignDominant,
    autopilotRejected,
    autopilotPending,
    followUpHighIntentQueued,
    followUpDueNowCount,
    fusionSummaryStatus,
    fusionSnapshotWarnings,
    manualOnlyAutopilotCount: manualOnlyCount,
    contentAssistEnabled: aiAutopilotContentAssistFlags.contentAssistV1,
    messagingAssistEnabled: aiAutopilotMessagingAssistFlags.messagingAssistV1,
    governanceWarnings,
  };

  const createdAt = new Date().toISOString();

  const escalationQueue = buildGrowthHumanReviewQueue({ status, topRisks }, ctx);

  const fallbackHumanLines: string[] = [];
  if (
    !growthGovernanceFlags.growthGovernanceEscalationV1 &&
    (status === "human_review_required" || hints.hr)
  ) {
    fallbackHumanLines.push(
      "Review governance top risks and CRM capacity before new growth experiments.",
    );
  }

  const humanReviewQueue = growthGovernanceFlags.growthGovernanceEscalationV1 ? escalationQueue : [];
  const humanReviewItems = growthGovernanceFlags.growthGovernanceEscalationV1
    ? escalationQueue.map((x) => `${x.title} — ${x.reason}`)
    : fallbackHumanLines;

  const shell: GrowthGovernanceDecision = {
    status,
    topRisks,
    blockedDomains,
    frozenDomains: [],
    humanReviewItems,
    humanReviewQueue,
    notes,
    createdAt,
  };

  const freeze = getGrowthFreezeState(shell);

  const decision: GrowthGovernanceDecision = {
    ...shell,
    frozenDomains: freeze.frozenDomains,
  };

  recordGrowthGovernanceEvaluation({
    decision,
    governanceWarnings,
    reviewQueueSize: decision.humanReviewItems.length,
    blockedCount: blockedDomains.length,
    frozenCount: freeze.frozenDomains.length,
  });

  return decision;
}
