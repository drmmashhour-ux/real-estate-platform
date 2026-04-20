export type BookingComPushPayload = {
  listingId: string;
  externalListingRef: string;
  connectionId: string;
};

export async function pushToBookingCom(_data: BookingComPushPayload): Promise<void> {
  // Future: Booking.com Connectivity API.
}
