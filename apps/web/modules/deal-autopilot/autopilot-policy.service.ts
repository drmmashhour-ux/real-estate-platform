import { dealAutopilotFlags } from "@/config/feature-flags";

export function assertDealAutopilotEnabled(): void {
  if (!dealAutopilotFlags.smartDealAutopilotV1) {
    throw new Error("Smart Deal Autopilot is disabled.");
  }
}

export function assertClosingReadinessFlag(): boolean {
  return dealAutopilotFlags.closingReadinessAutopilotV1;
}
