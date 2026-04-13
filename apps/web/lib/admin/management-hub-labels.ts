/** Human labels for `PlatformRevenueEvent.entityType` keys in admin UI. */

export function formatEntityTypeLabel(entityType: string): string {
  const map: Record<string, string> = {
    booking: "BNHUB · bookings",
    transaction: "Transactions",
    subscription: "Subscriptions",
    promotion: "Promotions",
    ai_feature: "AI & add-ons",
  };
  return map[entityType] ?? entityType.replace(/_/g, " ");
}
