import { prisma } from "@/lib/db";
import {
  COORDINATION_ORCHESTRATOR_VERSION,
  type AgentDecision,
  type CoordinationRunResult,
} from "@/modules/agents/agent.types";
import {
  buildConversationAgentContext,
  buildDealAgentContext,
  buildListingAgentContext,
} from "@/modules/agents/agent-context.service";
import { runPricingAgent } from "@/modules/agents/pricing.agent";
import { runRankingAgent } from "@/modules/agents/ranking.agent";
import { runEsgAgent } from "@/modules/agents/esg.agent";
import { runMessagingAgent } from "@/modules/agents/messaging.agent";
import { runDealAgent } from "@/modules/agents/deal.agent";
import { aggregateAgentDecisions } from "@/modules/agents/agent-aggregation.service";
import { evaluateAgentPolicySafety } from "@/modules/agents/agent-policy-gate.service";
import { enqueueCoordinationProposals } from "@/modules/agents/agent-proposal-enqueue.service";
import { logAgentStrategyApplied } from "@/modules/agents/agent-evolution-hook";

async function persistAgentRun(input: {
  entityType: string;
  entityId: string;
  userId: string;
  decisions: AgentDecision[];
  output: CoordinationRunResult;
}) {
  try {
    await prisma.agentRun.create({
      data: {
        agentName: "MULTI_AGENT_COORDINATION",
        entityType: input.entityType,
        entityId: input.entityId,
        runMode: "MANUAL",
        status: "SUCCESS",
        inputSnapshotJson: { entityId: input.entityId } as object,
        outputSnapshotJson: input.output as unknown as object,
        orchestratorVersion: COORDINATION_ORCHESTRATOR_VERSION,
        triggeredByUserId: input.userId,
      },
    });
  } catch {
    // non-fatal
  }
}

async function finalizeCoordinationRun(params: {
  entityKind: "listing" | "deal" | "conversation";
  entityId: string;
  decisions: AgentDecision[];
  ownerUserId: string;
}): Promise<CoordinationRunResult> {
  const { entityKind, entityId, decisions, ownerUserId } = params;

  for (const d of decisions) {
    logAgentStrategyApplied({
      agentType: d.agentType,
      entityKind,
      entityId,
      decisionType: d.decisionType,
      confidence: d.confidence,
    });
  }

  const aggregated = aggregateAgentDecisions(decisions);
  const policy = evaluateAgentPolicySafety(decisions);

  let enqueuedTaskIds: string[] = [];
  if (!policy.blocked && aggregated.actions.length > 0) {
    enqueuedTaskIds = await enqueueCoordinationProposals({
      entityType: entityKind,
      entityId,
      ownerUserId,
      actions: aggregated.actions,
      elevatedPriority: policy.requiresHumanApproval || !policy.allowed,
    });
  }

  const result: CoordinationRunResult = {
    entityKind,
    entityId,
    decisions,
    aggregated,
    policy,
    enqueuedTaskIds,
    orchestratorVersion: COORDINATION_ORCHESTRATOR_VERSION,
  };

  if (decisions.length > 0) {
    await persistAgentRun({
      entityType: entityKind,
      entityId,
      userId: ownerUserId,
      decisions,
      output: result,
    });
  }

  return result;
}

export async function runAgentsForListing(
  listingId: string,
  ownerUserId: string,
): Promise<CoordinationRunResult | null> {
  const ctx = await buildListingAgentContext(listingId);
  if (!ctx) {
    return null;
  }
  const decisions: AgentDecision[] = [
    runPricingAgent(ctx),
    runRankingAgent(ctx),
    runEsgAgent(ctx),
  ];
  return finalizeCoordinationRun({ entityKind: "listing", entityId: listingId, decisions, ownerUserId });
}

export async function runAgentsForDeal(dealId: string, ownerUserId: string): Promise<CoordinationRunResult | null> {
  const deal = await buildDealAgentContext(dealId);
  if (!deal) {
    return null;
  }

  const decisions: AgentDecision[] = [runDealAgent(deal)];

  if (deal.listingId) {
    const listingCtx = await buildListingAgentContext(deal.listingId);
    if (listingCtx) {
      decisions.push(runPricingAgent(listingCtx), runRankingAgent(listingCtx), runEsgAgent(listingCtx));
    }
  }

  return finalizeCoordinationRun({ entityKind: "deal", entityId: dealId, decisions, ownerUserId });
}

export async function runAgentsForConversation(
  conversationId: string,
  ownerUserId: string,
): Promise<CoordinationRunResult | null> {
  const conv = await buildConversationAgentContext(conversationId);
  if (!conv) {
    return null;
  }

  const decisions: AgentDecision[] = [runMessagingAgent(conv)];

  if (conv.listingId) {
    const listingCtx = await buildListingAgentContext(conv.listingId);
    if (listingCtx) {
      decisions.push(runPricingAgent(listingCtx), runRankingAgent(listingCtx), runEsgAgent(listingCtx));
    }
  }

  return finalizeCoordinationRun({
    entityKind: "conversation",
    entityId: conversationId,
    decisions,
    ownerUserId,
  });
}
