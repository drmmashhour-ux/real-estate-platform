import { prisma } from "@/lib/db";
import { getOrCreateCeoPolicy, requiresApprovalForProposal } from "@/modules/ceo-ai/ceo-ai-policy";
import type { CeoDecisionProposal } from "@/modules/ceo-ai/ceo-ai.types";
import type { CeoDecision, CeoContext } from "./ceo.types";
import { mapPayloadKindToDecisionType, recordCeoDecisionMemory, extractFlatMetricsFromCeoContext } from "./ceo-memory.service";

export type CeoRouteGuardResult = {
  shouldRoute: boolean;
  reason?: string;
  forceApproval: boolean;
};

/**
 * AI CEO proposals — cooldown / pattern / confidence guards (mirrors strategic routing posture).
 */
export async function shouldRouteCeoDecision(
  proposal: CeoDecisionProposal,
  fingerprint: string,
): Promise<CeoRouteGuardResult> {
  const policy = await getOrCreateCeoPolicy();
  const forceApproval = requiresApprovalForProposal(proposal.domain, proposal.payload, policy);
  const decisionType = mapPayloadKindToDecisionType(proposal.payload.kind);
  const domainSlice = proposal.domain.slice(0, 24);
  const fp = fingerprint.slice(0, 128);

  const recentSimilar = await prisma.ceoDecisionMemory.findFirst({
    where: {
      domain: domainSlice,
      decisionType,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recentSimilar) {
    return { shouldRoute: false, reason: "cooldown", forceApproval };
  }

  const patternKey = `${decisionType}_${domainSlice}_${fp}`.slice(0, 128);
  const pattern = await prisma.ceoStrategyPattern.findUnique({
    where: { patternKey },
  });
  if (pattern && pattern.score < -5) {
    return { shouldRoute: false, reason: "failure_pattern", forceApproval };
  }

  if ((proposal.confidence ?? 0) < 0.6) {
    return { shouldRoute: false, reason: "low_confidence", forceApproval };
  }

  return { shouldRoute: true, forceApproval };
}

export class CeoRoutingService {
  /**
   * Routes decisions to appropriate systems with safety guards.
   * Persists memory only after a successful route via {@link recordCeoDecisionMemory}.
   */
  static async routeCeoDecisions(decisions: CeoDecision[], context: CeoContext, fingerprint: string): Promise<void> {
    const fp = fingerprint.slice(0, 128);
    const flatMetrics = extractFlatMetricsFromCeoContext(context);

    for (const decision of decisions) {
      const recentSimilar = await prisma.ceoDecisionMemory.findFirst({
        where: {
          domain: decision.domain.slice(0, 24),
          decisionType: decision.decisionType,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (recentSimilar) {
        console.warn(`[ceo] Decision routing blocked: Cooldown active for ${decision.decisionType} ${decision.domain}`);
        continue;
      }

      const pattern = await prisma.ceoStrategyPattern.findUnique({
        where: { patternKey: `${decision.decisionType}_${decision.domain}_${fp}`.slice(0, 128) },
      });

      if (pattern && pattern.score < -5) {
        console.warn(
          `[ceo] Decision routing blocked: High failure pattern detected for ${decision.decisionType} ${decision.domain}`,
        );
        continue;
      }

      if (decision.confidence < 0.6) {
        console.warn(`[ceo] Decision routing blocked: Low confidence (${decision.confidence.toFixed(2)})`);
        continue;
      }

      const requiresApproval = ["PRICING", "PRODUCT"].includes(decision.domain) || decision.confidence < 0.8;

      try {
        if (decision.decisionType === "EXPERIMENT") {
          await this.createEvolutionExperiment(decision, requiresApproval);
        } else {
          await this.createExecutiveTask(decision, requiresApproval);
        }

        await recordCeoDecisionMemory(decision, fp, flatMetrics);
      } catch (e) {
        console.error(`[ceo] Route failed for ${decision.id}`, e);
        continue;
      }

      console.log(`[ceo] Routed decision ${decision.id} (${decision.decisionType} ${decision.domain}, Approval: ${requiresApproval})`);
    }
  }

  private static async createEvolutionExperiment(decision: CeoDecision, requiresApproval: boolean) {
    await prisma.evolutionSafeExperiment.create({
      data: {
        domain: decision.domain.slice(0, 16),
        experimentKey: `CEO_EXP_${decision.id}`.slice(0, 128),
        name: `CEO Proposed Experiment: ${decision.domain}`.slice(0, 256),
        armsJson: decision.payloadJson as object,
        status: requiresApproval ? "DRAFT" : "ACTIVE",
        requiresHumanApproval: requiresApproval,
        trafficCapPercent: 10,
      },
    });
  }

  private static async createExecutiveTask(decision: CeoDecision, requiresApproval: boolean) {
    await prisma.executiveTask.create({
      data: {
        entityType: "CEO_STRATEGY",
        entityId: decision.id,
        originatingAgent: "ceo-ai",
        taskType: decision.decisionType,
        title: `[CEO] ${decision.decisionType} ${decision.domain}`.slice(0, 512),
        summary: decision.reasoning,
        priority: decision.confidence > 0.85 ? "HIGH" : "MEDIUM",
        status: "OPEN",
        payloadJson: decision.payloadJson as object,
        requiresHumanApproval: requiresApproval,
      },
    });
  }
}
