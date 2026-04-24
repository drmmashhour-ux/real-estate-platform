import { AgentType, type AgentDecision, type PolicyGateResult } from "@/modules/agents/agent.types";
import type { EvaluateGrowthPoliciesContext } from "@/modules/growth/policy/growth-policy.types";
import { evaluateGrowthPolicies } from "@/modules/growth/policy/growth-policy.service";

/**
 * Maps agent outputs into growth-policy signals — advisory rules, then mapped to execution gates.
 * Agents never bypass this layer for automated production writes.
 */
export function buildGrowthPolicyContextFromAgentDecisions(decisions: AgentDecision[]): EvaluateGrowthPoliciesContext {
  const ctx: EvaluateGrowthPoliciesContext = {};
  const pricing = decisions.find((d) => d.agentType === AgentType.PRICING_AGENT);
  const messaging = decisions.find((d) => d.agentType === AgentType.MESSAGING_AGENT);
  const ranking = decisions.find((d) => d.agentType === AgentType.RANKING_AGENT);

  if (pricing && typeof pricing.payload.suggestedDeltaPct === "number") {
    const d = Math.abs(pricing.payload.suggestedDeltaPct as number);
    if (d > 3) {
      ctx.pricingMetrics = {
        unstableSignals: true,
        volatilityScore: Math.min(1, d / 25),
      };
    }
  }

  if (messaging && typeof messaging.payload.queueDepth === "number") {
    const q = messaging.payload.queueDepth as number;
    ctx.messagingMetrics = {
      queued: q,
      responded: 0,
      responseRate: q > 5 ? 0.2 : 0.7,
    };
  }

  if (ranking?.payload.signal === "demote") {
    ctx.contentMetrics = { generatedCount: 0, engagementCount: 0 };
  }

  return ctx;
}

export function evaluateAgentPolicySafety(decisions: AgentDecision[]): PolicyGateResult {
  const policyContext = buildGrowthPolicyContextFromAgentDecisions(decisions);
  const policyResults = evaluateGrowthPolicies(policyContext);

  const hasCritical = policyResults.some((r) => r.severity === "critical");
  const hasWarning = policyResults.some((r) => r.severity === "warning");

  return {
    allowed: !hasCritical && !hasWarning,
    requiresHumanApproval: !hasCritical && hasWarning,
    blocked: hasCritical,
    policyResults,
  };
}
