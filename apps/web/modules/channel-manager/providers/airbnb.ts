/**
 * Airbnb REST API sync placeholder — replace with OAuth + Partner API calls.
 */
export type AirbnbPushPayload = {
  listingId: string;
  externalListingRef: string;
  connectionId: string;
};

export async function pushToAirbnb(data: AirbnbPushPayload): Promise<void> {
  // Future: POST availability/rates to Airbnb API using encrypted tokens on `BnhubChannelConnection`.
  if (process.env.NODE_ENV === "development") {
    console.log("[BnHub channel] Airbnb sync placeholder", data.listingId, data.externalListingRef);
  }
}
