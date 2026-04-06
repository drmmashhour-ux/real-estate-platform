import { logInfo } from "@/lib/logger";
import { recordMonetizationBillingEvent, type MonetizationBillingEventName } from "./billing-events";

function billingNameForStream(type: "lead" | "booking" | "featured"): MonetizationBillingEventName {
  if (type === "lead") return "lead_purchased";
  if (type === "booking") return "booking_fee_collected";
  return "upgrade_purchased";
}

/**
 * Structured monetization trace: logs + durable `launch_events` row (`mgr:billing:*`).
 */
export async function trackRevenueEvent(input: {
  type: "lead" | "booking" | "featured";
  amountCents: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const name = billingNameForStream(input.type);
  logInfo("[revenue]", {
    stream: input.type,
    name,
    amountCents: input.amountCents,
    userId: input.userId ?? null,
    ...input.metadata,
  });
  await recordMonetizationBillingEvent(name, {
    userId: input.userId,
    amountCents: input.amountCents,
    metadata: input.metadata,
  });
}
