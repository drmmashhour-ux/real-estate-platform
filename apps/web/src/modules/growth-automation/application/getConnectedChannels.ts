import { listMarketingChannelsSafe } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

export async function getConnectedChannels() {
  return listMarketingChannelsSafe();
}
