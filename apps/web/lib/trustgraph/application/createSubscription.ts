import { createSubscriptionRecord } from "@/lib/trustgraph/infrastructure/services/billingService";

export async function createSubscription(args: Parameters<typeof createSubscriptionRecord>[0]) {
  return createSubscriptionRecord(args);
}
