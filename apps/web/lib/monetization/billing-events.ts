import { prisma } from "@/lib/db";

export const MONETIZATION_BILLING_EVENTS = [
  "booking_fee_collected",
  "lead_purchased",
  "subscription_started",
  "upgrade_purchased",
] as const;

export type MonetizationBillingEventName = (typeof MONETIZATION_BILLING_EVENTS)[number];

const PREFIX = "mgr:billing:";

/**
 * Persists monetization milestones to `launch_events` (no change to funnel enum).
 */
export async function recordMonetizationBillingEvent(
  name: MonetizationBillingEventName,
  input: {
    userId?: string | null;
    amountCents?: number;
    currency?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const payload = {
    v: 1,
    name,
    amountCents: input.amountCents,
    currency: input.currency ?? "cad",
    ...(input.metadata ?? {}),
  };
  await prisma.launchEvent.create({
    data: {
      event: `${PREFIX}${name}`,
      payload,
      userId: input.userId?.trim() || null,
    },
  });
}
