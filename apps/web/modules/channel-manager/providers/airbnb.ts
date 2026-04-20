/**
 * Airbnb REST API sync placeholder — replace with OAuth + Partner API calls.
 */
export type AirbnbPushPayload = {
  listingId: string;
  externalListingRef: string;
  connectionId: string;
};

export async function pushToAirbnb(_data: AirbnbPushPayload): Promise<void> {
  // Future: POST availability/rates to Airbnb API using stored tokens on `BnhubChannelConnection`.
}
