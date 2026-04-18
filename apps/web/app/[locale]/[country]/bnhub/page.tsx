import Link from "next/link";
import { FeaturedListings } from "@/components/bnhub/FeaturedListings";
import { BnhubLandingJourneySimulations } from "@/components/bnhub/BnhubLandingJourneySimulations";
import { BnhubLuxurySplitHero } from "@/components/bnhub/BnhubLuxurySplitHero";
import { StaysGuestBookingDashboard } from "@/components/bnhub/stays-guest-booking-dashboard";
import { SponsoredListings } from "@/components/bnhub/SponsoredListings";
import { PlatformTrustStrip } from "@/components/conversion/PlatformTrustStrip";
import { PUBLIC_MAP_SEARCH_URL } from "@/lib/search/public-map-search-urls";
import { getGuestId } from "@/lib/auth/session";
import { HubJourneyBanner } from "@/components/journey/HubJourneyBanner";

export default async function BNHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const guestId = await getGuestId().catch(() => null);
  return (
    <StaysGuestBookingDashboard
      activeMode="home"
      heroSlot={<BnhubLuxurySplitHero />}
      beforeOffers={
        <div className="space-y-4">
          <HubJourneyBanner hub="bnhub_guest" locale={locale} country={country} userId={guestId} />
          <PlatformTrustStrip className="border-premium-gold/20 bg-black/50 text-left sm:text-center" />
          <BnhubLandingJourneySimulations />
        </div>
      }
      bottomSlot={
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-premium-gold/25 bg-black/60 p-4 backdrop-blur-sm md:p-5">
            <h2 className="text-lg font-bold text-premium-gold">Prestige guests</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Signed-in travellers earn tier benefits on completed BNHUB stays — see your ribbon in the header when you qualify.
            </p>
            <Link
              href={PUBLIC_MAP_SEARCH_URL.bnhubStays}
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-bold text-premium-gold hover:underline"
            >
              Open full search →
            </Link>
          </div>
          <div className="rounded-2xl border border-premium-gold/25 bg-black/60 p-4 backdrop-blur-sm md:p-5">
            <h2 className="text-lg font-bold text-premium-gold">For hosts</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              When you confirm a reservation, guests receive a confirmation code by email to reopen their booking anytime after sign-in.
            </p>
            <Link
              href="/bnhub/host/dashboard"
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-bold text-premium-gold hover:underline"
            >
              Host dashboard →
            </Link>
          </div>
        </section>
      }
    >
      <FeaturedListings variant="booking" />
      <SponsoredListings variant="booking" />
    </StaysGuestBookingDashboard>
  );
}
