export function brokerDealDeepLink(dealId: string): { webPath: string } {
  return { webPath: `/dashboard/deals/${encodeURIComponent(dealId)}` };
}
