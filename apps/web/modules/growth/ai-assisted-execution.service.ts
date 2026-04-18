import type { AiAssistSuggestion, AiExecutionContext } from "./ai-assisted-execution.types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Deterministic assist suggestions from CRM signals only — no LLM, no outbound sends.
 */
export function buildAiExecutionSuggestions(context: AiExecutionContext): AiAssistSuggestion[] {
  if (context.governanceFreeze) {
    return [
      {
        id: "scale-v2-governance",
        type: "routing_decision",
        title: "Governance hold",
        suggestion:
          "Growth policy enforcement limits autonomous execution — review Governance / Policy Enforcement before acting on routing or pricing automations.",
        confidence: 1,
        requiresApproval: true,
      },
    ];
  }

  const score = context.topLeadScore ?? 0;
  const tier = (context.leadAiTier ?? "").toLowerCase();
  const pipe = (context.leadPipelineStatus ?? "new").toLowerCase();
  const brokerLabel = context.topBrokerLabel?.trim() || "Top-performing broker";

  const highQuality = score >= 70 || tier === "hot";
  const needsSpeed = pipe === "new" || pipe === "contacted" || pipe === "follow_up";
  const urgency = tier === "hot" || pipe === "meeting" || pipe === "negotiation";

  const suggestions: AiAssistSuggestion[] = [
    {
      id: "scale-v2-followup-5m",
      type: "lead_followup",
      title: "Speed-to-lead",
      suggestion: "Follow up with lead within 5 min",
      confidence: clamp01(needsSpeed ? 0.72 + Math.min(0.2, score / 500) : 0.45),
      requiresApproval: true,
    },
    {
      id: "scale-v2-premium-price",
      type: "pricing_adjustment",
      title: "Pricing posture",
      suggestion: "This lead is high quality — consider premium pricing",
      confidence: clamp01(highQuality ? 0.68 + Math.min(0.22, score / 400) : 0.38),
      requiresApproval: true,
    },
    {
      id: "scale-v2-broker-priority",
      type: "routing_decision",
      title: "Broker routing",
      suggestion: `${brokerLabel} has highest close rate — prioritize`,
      confidence: clamp01(context.topBrokerId ? 0.7 : 0.42),
      requiresApproval: true,
    },
    {
      id: "scale-v2-showing",
      type: "lead_followup",
      title: "Pipeline push",
      suggestion: "Lead shows urgency — push showing",
      confidence: clamp01(urgency ? 0.75 : 0.4 + (score >= 60 ? 0.12 : 0)),
      requiresApproval: true,
    },
  ];

  return suggestions;
}
