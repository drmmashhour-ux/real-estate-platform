import { cancelSubscriptionRecord } from "@/lib/trustgraph/infrastructure/services/billingService";

export async function cancelSubscription(args: Parameters<typeof cancelSubscriptionRecord>[0]) {
  return cancelSubscriptionRecord(args);
}
