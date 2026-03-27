import { updateSubscriptionRecord } from "@/lib/trustgraph/infrastructure/services/billingService";

export async function updateSubscription(args: Parameters<typeof updateSubscriptionRecord>[0]) {
  return updateSubscriptionRecord(args);
}
