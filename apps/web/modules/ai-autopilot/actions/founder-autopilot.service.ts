import { aiAutopilotV1Flags } from "@/config/feature-flags";
import type { ProposedAction } from "../ai-autopilot.types";

/** Admin/founder scope — platform-level observations only. */
export function proposalsFounderAdmin(): ProposedAction[] {
  if (!aiAutopilotV1Flags.founderDomain) return [];
  return [
    {
      domain: "founder_admin",
      entityType: "platform",
      entityId: null,
      actionType: "review_fraud_and_trust_dashboards",
      title: "Review fraud + trust signals weekly",
      summary:
        "Autopilot will not auto-block or auto-publish — route high severity items to human review queues you already use.",
      severity: "medium",
      riskLevel: "MEDIUM",
      recommendedPayload: { adminPaths: ["/admin/fraud", "/admin/reputation"] },
      reasons: {
        triggeredBy: "founder domain flag",
        expectedBenefit: "Catch systemic issues before they hit conversion",
        confidence: 0.5,
      },
      subjectUserId: null,
      audience: "founder",
    },
  ];
}
