import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/bnhub/listings";
import { getListingAverageRating } from "@/lib/bnhub/reviews";
import { getGuestId } from "@/lib/auth/session";
import { isTripleVerified } from "@/lib/verification/ownership";
import { BookingForm } from "../booking-form";
import { ListingImageGallery } from "../listing-image-gallery";
import { AvailabilityCalendar } from "../availability-calendar";

export default async function BNHubListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, guestId, tripleVerified] = await Promise.all([
    getListingById(id),
    getGuestId(),
    isTripleVerified(id),
  ]);
  if (!listing) notFound();

  const avgRating = getListingAverageRating(listing.reviews);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/bnhub"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to search
          </Link>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold sm:text-3xl">{listing.title}</h1>
                {tripleVerified && (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300 ring-1 ring-emerald-500/40" title="Cadastre verified; identity verified; location verified">
                    Verified Property
                  </span>
                )}
                {listing.owner?.hostQuality?.isSuperHost && (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300 ring-1 ring-amber-500/40">
                    Super Host
                  </span>
                )}
              </div>
              <p className="text-slate-400">
                {listing.city}, {listing.country} · {listing.beds} beds · {listing.baths} baths · up to {listing.maxGuests} guests
              </p>
              {avgRating != null && (
                <p className="mt-2 text-sm text-slate-400">
                  ★ {avgRating} ({listing.reviews.length} review{listing.reviews.length !== 1 ? "s" : ""})
                </p>
              )}

              <ListingImageGallery
                photos={
                  listing.listingPhotos?.length
                    ? listing.listingPhotos.map((p) => p.url)
                    : listing.photos
                }
              />

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold text-slate-200">What this place offers</h2>
                <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-400 sm:grid-cols-3">
                  <li>{listing.beds} bed{listing.beds !== 1 ? "s" : ""}</li>
                  <li>{listing.baths} bath{listing.baths !== 1 ? "s" : ""}</li>
                  <li>Up to {listing.maxGuests} guests</li>
                  <li>{listing.city}, {listing.country}</li>
                  {listing.amenities?.length ? listing.amenities.slice(0, 6).map((a) => <li key={a}>{a}</li>) : null}
                </ul>
              </div>
              {listing.houseRules && (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h2 className="text-lg font-semibold text-slate-200">House rules</h2>
                  <p className="mt-2 text-sm text-slate-400">{listing.houseRules}</p>
                  {listing.checkInTime && (
                    <p className="mt-2 text-sm text-slate-400">
                      Check-in: {listing.checkInTime}
                      {listing.checkOutTime && ` · Check-out: ${listing.checkOutTime}`}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold text-slate-200">
                  Hosted by {listing.owner.name ?? "Host"}
                  {listing.owner?.hostQuality?.isSuperHost && (
                    <span className="ml-2 text-amber-400">Super Host</span>
                  )}
                </h2>
                {listing.owner?.hostQuality && (
                  <p className="mt-1 text-sm text-slate-400">
                    Host quality score: {(listing.owner.hostQuality.qualityScore).toFixed(1)} / 5
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-400">Your host for this stay.</p>
                <Link
                  href={`/messages?host=${listing.owner.id}&listing=${listing.id}`}
                  className="mt-3 inline-block rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  Contact host
                </Link>
              </div>

              {listing.description && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-200">About</h2>
                  <p className="mt-2 text-slate-400">{listing.description}</p>
                </div>
              )}

              {listing.latitude != null && listing.longitude != null && (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 overflow-hidden">
                  <h2 className="text-lg font-semibold text-slate-200">Location</h2>
                  <p className="mt-1 text-sm text-slate-400">{listing.address}, {listing.city}, {listing.country}</p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}&zoom=15`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    View on map →
                  </a>
                  <iframe
                    title="Map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.02}%2C${listing.latitude - 0.01}%2C${listing.longitude + 0.02}%2C${listing.latitude + 0.01}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`}
                    className="mt-3 h-64 w-full rounded-lg border-0"
                    loading="lazy"
                  />
                </div>
              )}

              {listing.reviews.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-slate-200">Reviews</h2>
                  <ul className="mt-3 space-y-3">
                    {listing.reviews.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                      >
                        <p className="text-sm font-medium text-slate-300">
                          ★ {r.propertyRating} · {r.guest.name ?? "Guest"}
                        </p>
                        {r.comment && (
                          <p className="mt-1 text-sm text-slate-400">{r.comment}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                <p className="text-2xl font-semibold text-slate-100">
                  ${(listing.nightPriceCents / 100).toFixed(0)}{" "}
                  <span className="text-base font-normal text-slate-400">/ night</span>
                  {listing.instantBookEnabled && (
                    <span className="ml-2 rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      Instant book
                    </span>
                  )}
                </p>
                {listing.cleaningFeeCents > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Cleaning fee ${(listing.cleaningFeeCents / 100).toFixed(0)}
                  </p>
                )}
                <BookingForm
                  listingId={listing.id}
                  nightPriceCents={listing.nightPriceCents}
                  cleaningFeeCents={listing.cleaningFeeCents ?? 0}
                  instantBookEnabled={listing.instantBookEnabled ?? false}
                  guestId={guestId}
                  houseRules={listing.houseRules}
                  cancellationPolicy={listing.cancellationPolicy}
                />
                <div className="mt-6">
                  <AvailabilityCalendar listingId={listing.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
