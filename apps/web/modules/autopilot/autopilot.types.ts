import type { AutomationHubId, RiskTier } from "@/modules/automation/automation.types";

/** Core LECIPM autopilot domains (persisted on `LecipmCoreAutopilotAction.domain`). */
export type { AutopilotDomain } from "@/src/modules/autopilot/types";

export type AutopilotStage = "1" | "2" | "3" | "4";

export type AutopilotModeDescriptor = {
  hub: AutomationHubId;
  stage: AutopilotStage;
  label: string;
  /** User-visible disclaimer */
  disclaimer: string;
};

export type AutopilotActionDescriptor = {
  key: string;
  hub: AutomationHubId;
  risk: RiskTier;
  requiresApproval: boolean;
  notes: string;
};
