import { getSubscriptionStatusDto } from "@/lib/trustgraph/infrastructure/services/billingService";

export async function getSubscriptionStatus(workspaceId: string) {
  return getSubscriptionStatusDto(workspaceId);
}
