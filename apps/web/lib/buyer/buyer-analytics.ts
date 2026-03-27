import { recordPlatformEvent } from "@/lib/observability";

export type BuyerGrowthEvent =
  | "LISTING_VIEW"
  | "CONTACT_LISTING_BROKER"
  | "REQUEST_PLATFORM_BROKER"
  | "ADVISORY_PURCHASE"
  | "MORTGAGE_REQUEST";

export async function recordBuyerGrowthEvent(
  name: BuyerGrowthEvent,
  entityId: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    await recordPlatformEvent({
      eventType: name,
      sourceModule: "buyer_marketplace",
      entityType: "BUYER_FUNNEL",
      entityId,
      payload: payload ?? {},
    });
  } catch {
    /* non-fatal */
  }
}
