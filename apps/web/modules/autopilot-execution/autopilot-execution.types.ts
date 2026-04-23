import type { Prisma } from "@prisma/client";

import type { LecipmAutopilotDomainId } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";

export type AutopilotCandidateContext = {
  /** Source engine identifier (e.g. growth_brain, broker_assistant). */
  sourceSystem: string;
  /** Stable action key evaluated by policy (`lead.route`, `marketing.draft.email`, …). */
  actionType: string;
  domain: LecipmAutopilotDomainId;
  title: string;
  summary: string;
  candidatePayload?: Prisma.InputJsonValue;
  /** Optional correlation / dedupe key. */
  fingerprint?: string;
  subjectUserId?: string | null;
  /** Passed into policy engine (e.g. forceApproval, complianceSensitive). */
  policyContext?: Record<string, unknown>;
};

export type AutopilotOrchestrationResult = {
  executionId: string;
  outcome: "ALLOW_AUTOMATIC" | "REQUIRE_APPROVAL" | "BLOCK";
  platformActionId?: string | null;
  policyRuleId: string;
  explanation: string;
};
