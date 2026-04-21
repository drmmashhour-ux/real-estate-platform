import type { LecipmBrokerAutopilotMode } from "@prisma/client";

/** UI / product modes — persisted via `LecipmBrokerAutopilotSetting.mode` */
export type AutopilotUiMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type AutopilotReplyResult = {
  reply: string;
  confidence: number;
  riskLevel: RiskLevel;
  /** Broker must approve before sending (always true when any doubt). */
  requiresApproval: boolean;
  /** Allowed to one-tap send under FULL + LOW risk rules (still labeled AI). */
  eligibleForLowRiskAutoSend: boolean;
  disclaimer: string;
};

export const AUTOPILOT_DISCLAIMER =
  "AI-generated message — review recommended";

export function prismaAutopilotModeToUi(m: LecipmBrokerAutopilotMode): AutopilotUiMode {
  switch (m) {
    case "off":
      return "OFF";
    case "assist":
      return "ASSIST";
    case "safe_autopilot":
      return "SAFE_AUTOPILOT";
    case "approval_required":
      return "FULL_AUTOPILOT_APPROVAL";
    default:
      return "ASSIST";
  }
}

export function uiAutopilotModeToPrisma(m: AutopilotUiMode): LecipmBrokerAutopilotMode {
  switch (m) {
    case "OFF":
      return "off";
    case "ASSIST":
      return "assist";
    case "SAFE_AUTOPILOT":
      return "safe_autopilot";
    case "FULL_AUTOPILOT_APPROVAL":
      return "approval_required";
    default:
      return "assist";
  }
}
