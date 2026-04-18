import { aiAutopilotV1Flags } from "@/config/feature-flags";
import type { NormalizedSignal, ProposedAction } from "../ai-autopilot.types";

export function proposalsFromLeadSignals(signals: NormalizedSignal[], subjectUserId: string): ProposedAction[] {
  if (!aiAutopilotV1Flags.leadsDomain) return [];
  const out: ProposedAction[] = [];
  for (const s of signals) {
    if (s.domain !== "lead_crm" || s.signalType !== "stale_leads") continue;
    out.push({
      domain: "lead_crm",
      entityType: "broker",
      entityId: subjectUserId,
      actionType: "draft_follow_up_reminder",
      title: "Follow up on stale pipeline leads",
      summary:
        "Several leads have not moved in 14+ days — draft a follow-up sequence (no auto-send from autopilot v1).",
      severity: "medium",
      riskLevel: "MEDIUM",
      recommendedPayload: { staleLeadCount: s.metadata.staleLeadCount, crmPath: "/dashboard/broker/clients" },
      reasons: {
        triggeredBy: "stale_leads signal",
        dataSources: ["Lead.updatedAt", "pipelineStatus"],
        expectedBenefit: "Recover conversion-ready conversations",
        confidence: 0.75,
        cautions: ["OACIQ / consent rules apply at send-time"],
      },
      subjectUserId,
      audience: "broker",
    });
  }
  return out;
}
