/**
 * Company-level growth executive snapshot — read-only aggregation.
 */

import { prisma } from "@/lib/db";
import { growthFusionFlags, growthGovernanceFlags } from "@/config/feature-flags";
import { listAutopilotActionsWithStatus } from "./ai-autopilot-api.helpers";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "./ai-autopilot-followup.service";
import {
  computePaidFunnelAdsInsights,
  fetchEarlyConversionAdsSnapshot,
} from "./growth-ai-analyzer.service";
import { analyzeGrowthFusion } from "./growth-fusion-analyzer.service";
import { prioritizeGrowthFusionActions } from "./growth-fusion-prioritizer.service";
import { buildGrowthFusionSnapshot } from "./growth-fusion-snapshot.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { buildGrowthExecutivePriorities } from "./growth-executive-priority.service";
import {
  logGrowthExecutiveBuildStarted,
  recordGrowthExecutiveBuild,
} from "./growth-executive-monitoring.service";
import type { GrowthExecutivePriorityInput, GrowthExecutiveStatus, GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { AiAutopilotActionWithStatus } from "./ai-autopilot.types";

function deriveGrowthExecutiveStatus(args: {
  governance: GrowthGovernanceDecision | null;
  adsBand: "WEAK" | "OK" | "STRONG";
  leadsToday: number;
  hotLeads: number;
  hasAutopilotFocus: boolean;
  attributedCampaigns: number;
  totalEarlyLeads: number;
}): GrowthExecutiveStatus {
  const g = args.governance?.status;
  if (g === "human_review_required" || g === "freeze_recommended") {
    return "watch";
  }
  if (g === "caution" || g === "watch") {
    return "watch";
  }
  if (
    args.leadsToday === 0 &&
    args.adsBand === "WEAK" &&
    args.attributedCampaigns > 0 &&
    args.totalEarlyLeads >= 3
  ) {
    return "weak";
  }
  if (
    args.adsBand === "STRONG" &&
    args.hotLeads >= 1 &&
    g === "healthy" &&
    args.hasAutopilotFocus
  ) {
    return "strong";
  }
  if (args.hotLeads >= 1 && args.hasAutopilotFocus && (g == null || g === "healthy" || g === "watch")) {
    return "healthy";
  }
  if (args.adsBand === "OK" || args.adsBand === "STRONG") {
    return "healthy";
  }
  return "watch";
}

/**
 * Builds a single executive summary from existing growth modules. Does not mutate inputs.
 * Safe to import from command-center or other read-only surfaces later.
 */
export async function buildGrowthExecutiveSummary(): Promise<GrowthExecutiveSummary> {
  logGrowthExecutiveBuildStarted();
  const missingDataNotes: string[] = [];
  const topRisks: string[] = [];

  let autopilotPayload: Awaited<ReturnType<typeof listAutopilotActionsWithStatus>> | null = null;
  try {
    autopilotPayload = await listAutopilotActionsWithStatus();
  } catch {
    missingDataNotes.push("autopilot_payload_unavailable");
  }

  let early: Awaited<ReturnType<typeof fetchEarlyConversionAdsSnapshot>> | null = null;
  try {
    early = await fetchEarlyConversionAdsSnapshot();
  } catch {
    missingDataNotes.push("early_conversion_unavailable");
  }

  const insights = early
    ? computePaidFunnelAdsInsights(early)
    : { problems: [] as string[], opportunities: [] as string[], health: "WEAK" as const };
  const adsBand = insights.health;

  const attributedCampaigns =
    early?.campaignCounts.filter((c) => c.label !== "(no UTM)").length ?? 0;
  const totalCampaigns = early?.campaignCounts.length ?? 0;
  const topCampaign = early?.topCampaign?.label;
  const leadsToday = early?.leadsToday ?? 0;
  const totalEarlyLeads = early?.totalLeads ?? 0;

  let governanceDecision: GrowthGovernanceDecision | null = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governanceDecision = await evaluateGrowthGovernance();
    } catch {
      missingDataNotes.push("governance_unavailable");
    }
  }

  let fusionActions: Awaited<ReturnType<typeof prioritizeGrowthFusionActions>> = [];
  let fusionTopProblems: string[] = [];
  if (growthFusionFlags.growthFusionV1) {
    try {
      const snap = await buildGrowthFusionSnapshot();
      const summary = analyzeGrowthFusion(snap);
      fusionTopProblems = summary.topProblems.slice(0, 3);
      fusionActions = prioritizeGrowthFusionActions(summary);
    } catch {
      missingDataNotes.push("fusion_unavailable");
    }
  }

  let totalLeads = 0;
  let hotLeads = 0;
  try {
    const [t, h] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({
        where: {
          OR: [{ aiTier: "hot" }, { score: { gte: 75 } }],
        },
      }),
    ]);
    totalLeads = t;
    hotLeads = h;
  } catch {
    missingDataNotes.push("lead_counts_unavailable");
  }

  let dueNowCount = 0;
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
    dueNowCount = q.filter((i) => i.status === "due_now").length;
  } catch {
    missingDataNotes.push("followup_due_unavailable");
  }

  if (governanceDecision) {
    for (const r of governanceDecision.topRisks.slice(0, 3)) {
      topRisks.push(`[${r.category}] ${r.title}`);
    }
  }
  for (const p of fusionTopProblems) {
    topRisks.push(p);
  }
  for (const p of insights.problems.slice(0, 2)) {
    topRisks.push(p);
  }

  const autopilotActions: AiAutopilotActionWithStatus[] = autopilotPayload?.actions ?? [];
  const priorityInput: GrowthExecutivePriorityInput = {
    governanceDecision,
    fusionActions,
    autopilotActions,
    adsProblemLines: insights.problems,
    leadsToday,
    hotLeadCount: hotLeads,
    dueNowCount,
    fusionTopProblems,
  };

  const topPriorities = buildGrowthExecutivePriorities(priorityInput);

  const hasAutopilotFocus = !!(autopilotPayload?.focusTitle ?? topPriorities.find((x) => x.source === "autopilot"));

  const status = deriveGrowthExecutiveStatus({
    governance: governanceDecision,
    adsBand,
    leadsToday,
    hotLeads,
    hasAutopilotFocus,
    attributedCampaigns,
    totalEarlyLeads,
  });

  const createdAt = new Date().toISOString();
  const summary: GrowthExecutiveSummary = {
    status,
    topPriority: topPriorities[0]?.title,
    topPriorities,
    topRisks: topRisks.slice(0, 8),
    campaignSummary: {
      totalCampaigns,
      topCampaign,
      adsPerformance: adsBand,
    },
    leadSummary: {
      totalLeads,
      hotLeads,
      dueNow: dueNowCount > 0 ? dueNowCount : undefined,
    },
    governance: governanceDecision
      ? {
          status: governanceDecision.status,
          frozenDomains: governanceDecision.frozenDomains,
          blockedDomains: governanceDecision.blockedDomains,
        }
      : undefined,
    autopilot: autopilotPayload
      ? {
          focusTitle: autopilotPayload.focusTitle ?? undefined,
          status: autopilotPayload.autopilotStatus,
          topActionCount: autopilotActions.length,
        }
      : undefined,
    createdAt,
  };

  recordGrowthExecutiveBuild({
    status,
    topPriority: summary.topPriority,
    priorityCount: topPriorities.length,
    missingDataNotes,
  });

  return summary;
}
