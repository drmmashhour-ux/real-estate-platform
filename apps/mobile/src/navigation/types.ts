export type ManagerStackParamList = {
  Home: undefined;
  Listings: undefined;
  ListingDetails: { id: string };
  Booking: { listingId: string; listingTitle?: string };
  Profile: undefined;
  AIAssistant: { listingId?: string; bookingId?: string } | undefined;
};
