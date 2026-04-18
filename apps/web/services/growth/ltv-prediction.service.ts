/**
 * Heuristic LTV estimates for growth profit math — never fabricates LTV without booking signal.
 * Display "estimate" in UI when this path is used.
 */
export function estimateCampaignLTV(campaignData: {
  leads?: number;
  bookings?: number;
  avgBookingValue?: number | null;
}): number | null {
  if (!campaignData.leads) return null;

  const bookingRate = campaignData.leads > 0 ? (campaignData.bookings ?? 0) / campaignData.leads : 0;
  const avgBookingValue = campaignData.avgBookingValue ?? 200;

  if (bookingRate === 0) return null;

  return bookingRate * avgBookingValue;
}
