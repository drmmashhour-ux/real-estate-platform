import { prisma } from "@/lib/db";
import { CeoDecision, CeoDecisionProposal } from "./ceo-ai.types";
import { buildCeoContextFingerprint } from "./ceo-memory-context.service";
import { mapPayloadKindToDecisionType } from "./ceo-memory.service";
import { CeoDecision as DomainCeoDecision } from "./ceo.types";

/**
 * PHASE 5: ROUTING TO SYSTEM
 * Routes high-level CEO decisions into specific execution systems (rollouts, agents, evolution).
 */
export async function routeCeoDecisions(decisions: DomainCeoDecision[]) {
  const routedIds: string[] = [];

  for (const d of decisions) {
    // Persist the decision as a proposal
    const row = await prisma.ceoDecision.create({
      data: {
        decisionType: d.decisionType,
        domain: d.domain,
        title: `Strategic ${d.decisionType} in ${d.domain}`,
        summary: d.reasoning,
        rationale: d.reasoning,
        confidence: d.confidence,
        status: "PROPOSED",
        payloadJson: d.payloadJson,
      }
    });

    // Semantic routing logic
    if (d.domain === "MARKETING" && d.decisionType === "INVEST") {
      // Logic to create a rollout policy for ads/campaigns
      await prisma.seniorLivingGtmExecutionEvent.create({
        data: {
          eventType: "CEO_ROUTED_MARKETING_INVEST",
          quantity: 1,
          notes: `CEO routing: ${d.reasoning}`,
          metadata: { decisionId: row.id, payload: d.payloadJson } as any,
        }
      });
    } else if (d.domain === "DEALS" && d.decisionType === "SHIFT_FOCUS") {
      // Logic to trigger agent task or priority shift
      await prisma.evolutionOutcomeEvent.create({
        data: {
          domain: "DEALS",
          actionKey: "CEO_PRIORITY_SHIFT",
          success: true, // Marker for routing success
          metadata: { decisionId: row.id, focus: d.payloadJson.focus } as any,
        }
      });
    }

    routedIds.push(row.id);
    console.log(`[ceo] decision_routed: ${row.id} (${d.domain})`);
  }

  return routedIds;
}

/**
 * PHASE 9: ROUTING GUARDS
 * Filters and validates proposed decisions before they reach the human approval queue.
 * Prevents spamming failed strategies and ensures strategic cooldowns.
 */

/**
 * Validates if a proposed decision should be routed for approval.
 */
export async function shouldRouteCeoDecision(
  proposal: CeoDecisionProposal, 
  fingerprint: string
): Promise<{
  shouldRoute: boolean;
  reason?: string;
  forceApproval?: boolean;
}> {
  const decisionType = mapPayloadKindToDecisionType(proposal.payload.kind);
  const patternKey = `${proposal.domain}:${fingerprint}:${decisionType}`;

  // 1. Cooldown Guard: Don't propose the exact same action too frequently
  const cooldownPeriod = new Date(Date.now() - 72 * 3600000); // 72h cooldown
  const recentIdentical = await prisma.ceoDecision.findFirst({
    where: {
      domain: proposal.domain,
      title: proposal.title,
      createdAt: { gte: cooldownPeriod },
      status: { in: ["PROPOSED", "APPROVED", "EXECUTED"] }
    },
    select: { id: true, status: true }
  });

  if (recentIdentical) {
    return { 
      shouldRoute: false, 
      reason: `Identical decision already in ${recentIdentical.status} state (cooldown).` 
    };
  }

  // 2. Performance Guard: Don't route strategies that have failed multiple times in this context
  const pattern = await prisma.ceoStrategyPattern.findUnique({
    where: { patternKey }
  });

  if (pattern && pattern.score < -15 && pattern.negativeCount >= 3) {
    return { 
      shouldRoute: false, 
      reason: "This strategy pattern has consistently failed in this market context." 
    };
  }

  // 3. Scale Guard: If used many times, require fresh human look
  if (pattern && pattern.timesUsed > 12) {
    return { 
      shouldRoute: true, 
      forceApproval: true,
      reason: "Strategy has high usage; forcing human re-validation of rationale."
    };
  }

  return { shouldRoute: true };
}
