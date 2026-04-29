/** Host BNHub autopilot settings — mirrors model + `AutopilotMode` enum. */

export type AutopilotMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT_APPROVAL";

export const AutopilotMode = {
  OFF: "OFF" as AutopilotMode,
  ASSIST: "ASSIST" as AutopilotMode,
  SAFE_AUTOPILOT: "SAFE_AUTOPILOT" as AutopilotMode,
  FULL_AUTOPILOT_APPROVAL: "FULL_AUTOPILOT_APPROVAL" as AutopilotMode,
} as const;

export type HostAutopilotSettingsView = {
  id: string;
  mode: AutopilotMode;
  autoPricing: boolean;
  autoPromotions: boolean;
  autoListingOptimization: boolean;
  autoMessaging: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  maxDailyChangePct: number | null;
  requireApprovalForPricing: boolean;
  requireApprovalForPromotions: boolean;
  paused: boolean;
  pauseReason: string | null;
};
