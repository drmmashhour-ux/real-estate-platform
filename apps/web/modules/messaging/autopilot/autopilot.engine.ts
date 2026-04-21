import type { LecipmBrokerAutopilotMode } from "@prisma/client";
import {
  assessIncomingMessageRisk,
  isEligibleForLowRiskAutoSend,
} from "@/modules/messaging/autopilot/autopilot.rules";
import { generateBrokerAutopilotReply } from "@/modules/messaging/autopilot/reply.generator";
import {
  AUTOPILOT_DISCLAIMER,
  prismaAutopilotModeToUi,
  type AutopilotReplyResult,
  type AutopilotUiMode,
} from "@/modules/messaging/autopilot/autopilot.types";
import { logInfo } from "@/lib/logger";

const TAG = "[autopilot]";

export type RunAutopilotInput = {
  prismaMode: LecipmBrokerAutopilotMode | null | undefined;
  incomingClientMessage: string;
  transcriptSummary?: string;
  /** Serialized JSON or bullet text from CRM memory */
  clientProfileSummary?: string;
};

export async function runMessagingAutopilot(input: RunAutopilotInput): Promise<AutopilotReplyResult | null> {
  const uiMode: AutopilotUiMode = prismaAutopilotModeToUi(input.prismaMode ?? "assist");
  if (uiMode === "OFF") {
    logInfo(`${TAG} skipped.off`);
    return null;
  }

  const riskBlock = assessIncomingMessageRisk(input.incomingClientMessage);
  const generated = await generateBrokerAutopilotReply({
    incomingClientMessage: input.incomingClientMessage,
    transcriptSummary: input.transcriptSummary,
    clientProfileSummary: input.clientProfileSummary,
    risk: riskBlock,
  });

  let requiresApproval = true;
  let eligibleForLowRiskAutoSend = false;

  if (uiMode === "ASSIST") {
    requiresApproval = true;
  } else if (uiMode === "SAFE_AUTOPILOT") {
    requiresApproval = true;
  } else if (uiMode === "FULL_AUTOPILOT_APPROVAL") {
    eligibleForLowRiskAutoSend =
      isEligibleForLowRiskAutoSend(riskBlock) && riskBlock.riskLevel === "LOW";
    requiresApproval = !eligibleForLowRiskAutoSend;
  }

  /** Never auto-send negotiation / legal / pricing threads without explicit human approval */
  if (riskBlock.flags.legal || riskBlock.flags.negotiation || riskBlock.flags.pricing) {
    eligibleForLowRiskAutoSend = false;
    requiresApproval = true;
  }

  logInfo(`${TAG} result`, {
    uiMode,
    risk: riskBlock.riskLevel,
    requiresApproval,
    eligibleForLowRiskAutoSend,
  });

  return {
    reply: generated.reply,
    confidence: generated.confidence,
    riskLevel: riskBlock.riskLevel,
    requiresApproval,
    eligibleForLowRiskAutoSend,
    disclaimer: AUTOPILOT_DISCLAIMER,
  };
}
