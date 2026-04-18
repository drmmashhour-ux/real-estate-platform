/**
 * Multi-agent coordination orchestrator — read-only, advisory.
 */

import { prisma } from "@/lib/db";
import {
  aiAutopilotContentAssistFlags,
  aiAutopilotMessagingAssistFlags,
  growthFusionFlags,
  growthGovernanceFlags,
  growthMultiAgentFlags,
} from "@/config/feature-flags";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "./ai-autopilot-followup.service";
import { computePaidFunnelAdsInsights, fetchEarlyConversionAdsSnapshot } from "./growth-ai-analyzer.service";
import { analyzeGrowthFusion } from "./growth-fusion-analyzer.service";
import { prioritizeGrowthFusionActions } from "./growth-fusion-prioritizer.service";
import { buildGrowthFusionSnapshot } from "./growth-fusion-snapshot.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { detectGrowthAgentAlignments } from "./growth-agent-alignment.service";
import { detectGrowthAgentConflicts } from "./growth-agent-conflict.service";
import { resolveGrowthAgentPriorities } from "./growth-agent-priority.service";
import { logGrowthAgentCoordinationStarted, recordGrowthAgentCoordination } from "./growth-agent-monitoring.service";
import { buildAdsAgentProposals } from "./agents/ads-agent.service";
import { buildContentAgentProposals } from "./agents/content-agent.service";
import { buildCroAgentProposals } from "./agents/cro-agent.service";
import { buildFusionAgentProposals } from "./agents/fusion-agent.service";
import { buildGovernanceAgentProposals } from "./agents/governance-agent.service";
import { buildLeadsAgentProposals } from "./agents/leads-agent.service";
import { buildMessagingAgentProposals } from "./agents/messaging-agent.service";
import type { AgentCoordinationContext, GrowthAgentCoordinationResult, GrowthAgentProposal } from "./growth-agents.types";

async function buildAgentCoordinationContext(): Promise<AgentCoordinationContext> {
  let early: Awaited<ReturnType<typeof fetchEarlyConversionAdsSnapshot>> | null = null;
  let adsInsights: AgentCoordinationContext["adsInsights"] = null;
  try {
    early = await fetchEarlyConversionAdsSnapshot();
    adsInsights = computePaidFunnelAdsInsights(early);
  } catch {
    early = null;
    adsInsights = null;
  }

  let governance = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      governance = null;
    }
  }

  let fusionSummary: AgentCoordinationContext["fusionSummary"] = null;
  let fusionActions: AgentCoordinationContext["fusionActions"] = [];
  if (growthFusionFlags.growthFusionV1) {
    try {
      const raw = await buildGrowthFusionSnapshot();
      fusionSummary = analyzeGrowthFusion(raw);
      fusionActions = prioritizeGrowthFusionActions(fusionSummary);
    } catch {
      fusionSummary = null;
      fusionActions = [];
    }
  }

  let dueNowCount = 0;
  let hotLeadCount = 0;
  let crmLeadTotal = 0;
  try {
    crmLeadTotal = await prisma.lead.count();
    hotLeadCount = await prisma.lead.count({
      where: {
        OR: [{ aiTier: "hot" }, { score: { gte: 75 } }],
      },
    });
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
    dueNowCount = 0;
    hotLeadCount = 0;
    crmLeadTotal = 0;
  }

  return {
    adsInsights,
    leadsToday: early?.leadsToday ?? 0,
    totalEarlyLeads: early?.totalLeads ?? 0,
    governance,
    fusionActions,
    fusionSummary,
    dueNowCount,
    hotLeadCount,
    crmLeadTotal,
    messagingAssistEnabled: aiAutopilotMessagingAssistFlags.messagingAssistV1,
    contentAssistEnabled: aiAutopilotContentAssistFlags.contentAssistV1,
  };
}

function dedupeProposalIds(proposals: GrowthAgentProposal[]): GrowthAgentProposal[] {
  const seen = new Set<string>();
  return proposals.map((p, i) => {
    let id = p.id;
    let n = 0;
    while (seen.has(id)) {
      n += 1;
      id = `${p.id.slice(0, 72)}-${n}`;
    }
    seen.add(id);
    return id === p.id ? p : { ...p, id };
  });
}

function buildCoordinationNotes(
  proposals: GrowthAgentProposal[],
  conflicts: { length: number },
  alignments: { length: number },
): string[] {
  const notes: string[] = [];
  if (alignments.length > 0 && conflicts.length === 0) {
    notes.push("Agents show broad alignment — prioritize shared themes in review.");
  }
  if (conflicts.length > 0) {
    notes.push("Surface conflicts in standup — resolve sequencing before scaling spend or copy.");
  }
  const hasFollow = proposals.some(
    (p) =>
      (p.agentId === "leads_agent" || p.agentId === "messaging_agent") &&
      (p.title.toLowerCase().includes("due") || p.title.toLowerCase().includes("follow")),
  );
  if (hasFollow) {
    notes.push("Agents agree follow-up may be the current bottleneck.");
  }
  const scale = proposals.some((p) => p.agentId === "ads_agent" && p.title.toLowerCase().includes("scale"));
  const cro = proposals.some((p) => p.agentId === "cro_agent" && p.title.toLowerCase().includes("capture"));
  if (scale && cro) {
    notes.push("Growth scale suggestions coexist with CRO caution — sequence manually.");
  }
  if (notes.length === 0) {
    notes.push("Coordination snapshot complete — recommendations are advisory only.");
  }
  return notes.slice(0, 5);
}

/**
 * Runs one read-only coordination pass across growth agents.
 */
export async function coordinateGrowthAgents(): Promise<GrowthAgentCoordinationResult | null> {
  if (!growthMultiAgentFlags.growthMultiAgentV1) {
    return null;
  }

  logGrowthAgentCoordinationStarted();
  const ctx = await buildAgentCoordinationContext();

  const raw: GrowthAgentProposal[] = [
    ...buildAdsAgentProposals(ctx),
    ...buildCroAgentProposals(ctx),
    ...buildLeadsAgentProposals(ctx),
    ...buildMessagingAgentProposals(ctx),
    ...buildContentAgentProposals(ctx),
    ...buildGovernanceAgentProposals(ctx),
    ...buildFusionAgentProposals(ctx),
  ];

  const proposals = dedupeProposalIds(raw);

  const conflicts = growthMultiAgentFlags.growthAgentConflictV1 ? detectGrowthAgentConflicts(proposals) : [];

  const alignments = growthMultiAgentFlags.growthAgentAlignmentV1 ? detectGrowthAgentAlignments(proposals) : [];

  const topPriorities = resolveGrowthAgentPriorities(proposals, conflicts, alignments);

  const notes = buildCoordinationNotes(proposals, conflicts, alignments);

  const createdAt = new Date().toISOString();

  const missingAgentWarnings = proposals.length === 0 ? 1 : 0;

  recordGrowthAgentCoordination({
    proposalCount: proposals.length,
    conflictCount: conflicts.length,
    alignmentCount: alignments.length,
    topPriorities,
    missingAgentWarnings,
  });

  return {
    proposals,
    conflicts,
    alignments,
    topPriorities,
    notes,
    createdAt,
  };
}
