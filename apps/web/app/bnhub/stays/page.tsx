import { StaysGuestBookingDashboard } from "@/components/bnhub/stays-guest-booking-dashboard";
import { FeaturedListings } from "@/components/bnhub/FeaturedListings";
import { SponsoredListings } from "@/components/bnhub/SponsoredListings";

export default function BNHubStaysPage() {
  return (
    <StaysGuestBookingDashboard>
      <FeaturedListings variant="booking" />
      <SponsoredListings variant="booking" />
    </StaysGuestBookingDashboard>
  );
}
