import { publishApprovedContent } from "@/src/modules/growth-automation/application/publishApprovedContent";
import {
  getContentItem,
  updateContentItemStatus,
} from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { getGrowthPolicyConfig } from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";

export async function retryFailedPublication(itemId: string) {
  const item = await getContentItem(itemId);
  if (!item) throw new Error("Content item not found");
  if (item.status !== "FAILED") {
    throw new Error("Only failed items can be retried");
  }
  const { maxRetries } = getGrowthPolicyConfig();
  if (item.retryCount >= maxRetries) {
    throw new Error(`Max retries (${maxRetries}) reached`);
  }
  await updateContentItemStatus(itemId, {
    status: "APPROVED",
    lastError: null,
  });
  return publishApprovedContent(itemId);
}
