import { updateContentItemStatus } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

export async function approveContentItem(itemId: string) {
  return updateContentItemStatus(itemId, { status: "APPROVED" });
}
