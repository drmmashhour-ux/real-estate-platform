import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { BNHubCheckoutClient } from "./checkout-client";

export default async function BNHubCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ listingId?: string; checkIn?: string; checkOut?: string }>;
}) {
  const { listingId, checkIn, checkOut } = await searchParams;
  const guestId = await getGuestId();

  if (!listingId || !checkIn || !checkOut) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-200">Checkout</h1>
          <p className="mt-2 text-slate-400">Missing listing or dates. Select a listing and dates to continue.</p>
          <Link href="/bnhub/stays" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">Back to search</Link>
        </div>
      </main>
    );
  }

  const listing = await getListingById(listingId);
  if (!listing) notFound();

  const hostPayoutReady = Boolean(
    listing.owner.stripeAccountId && listing.owner.stripeOnboardingComplete
  );

  if (!listing.instantBookEnabled) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-200">Instant book only</h1>
          <p className="mt-2 text-slate-400">
            This listing uses request-to-book. Confirm dates on the listing page and submit a booking request;
            after the host approves, you can pay to confirm.
          </p>
          <Link
            href={`/bnhub/${listing.listingCode ?? listingId}`}
            className="mt-4 inline-block text-emerald-400 hover:text-emerald-300"
          >
            ← Back to listing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href={`/bnhub/${listingId}`} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to listing
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Confirm and pay</h1>
          <p className="mt-1 text-slate-400">{listing.title} · {listing.city}, {listing.country}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">Listing ID {listing.listingCode}</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <BNHubCheckoutClient
          listingId={listingId}
          listingTitle={listing.title}
          maxGuests={listing.maxGuests}
          checkIn={checkIn}
          checkOut={checkOut}
          guestId={guestId}
          houseRules={listing.houseRules}
          cancellationPolicy={listing.cancellationPolicy}
          hostPayoutReady={hostPayoutReady}
        />
      </section>
    </main>
  );
}
