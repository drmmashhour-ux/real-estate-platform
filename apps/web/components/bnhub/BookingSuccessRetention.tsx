import Link from "next/link";
import { getUnifiedRecommendations } from "@/lib/ai/recommendations/getUnifiedRecommendations";

function cover(listing: { listingPhotos?: { url: string }[]; photos?: unknown }): string | null {
  const p = listing.listingPhotos?.[0]?.url;
  if (p) return p;
  const raw = listing.photos;
  return Array.isArray(raw) && typeof raw[0] === "string" ? raw[0] : null;
}

export async function BookingSuccessRecommendedRow({
  userId,
  bookedListingId,
}: {
  userId: string;
  bookedListingId: string;
}) {
  const rows = (await getUnifiedRecommendations(userId, 6)).filter((l) => l.id !== bookedListingId).slice(0, 4);
  if (rows.length === 0) return null;

  return (
    <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">You might also like</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Similar stays &amp; popular picks</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((listing) => {
          const img = cover(listing);
          const price = (listing.nightPriceCents / 100).toLocaleString("en-CA", {
            style: "currency",
            currency: "CAD",
          });
          return (
            <li key={listing.id}>
              <Link
                href={`/bnhub/listings/${listing.id}`}
                className="flex gap-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 transition hover:border-emerald-200 hover:bg-white"
              >
                <div className="h-20 w-24 shrink-0 bg-slate-200">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 py-2 pr-2">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">{listing.title}</p>
                  <p className="text-xs text-slate-500">{listing.city}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">{price} / night</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BookingSuccessNextSteps({
  bookingId,
  listingTitle,
  paid,
}: {
  bookingId: string;
  listingTitle: string;
  paid: boolean;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next steps</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Before you arrive</h2>
      <ol className="mt-4 space-y-4 text-sm text-slate-700">
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
            1
          </span>
          <div>
            <p className="font-medium text-slate-900">Save your booking details</p>
            <p className="text-slate-600">
              Reference and dates are on your{" "}
              <Link href={`/bnhub/booking/${bookingId}`} className="font-medium text-emerald-700 underline-offset-2 hover:underline">
                booking page
              </Link>
              . Add them to your calendar from there.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
            2
          </span>
          <div>
            <p className="font-medium text-slate-900">Message your host</p>
            <p className="text-slate-600">
              Check the booking page for check-in instructions and any questions about <span className="font-medium">{listingTitle}</span>.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
            3
          </span>
          <div>
            <p className="font-medium text-slate-900">After your stay</p>
            <p className="text-slate-600">
              {paid ? (
                <>
                  Leave a review to help other guests — we&apos;ll remind you when the trip is marked complete.{" "}
                  <Link href="/bnhub/trips" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
                    View trips
                  </Link>
                  .
                </>
              ) : (
                "Once payment fully confirms, your host is notified automatically."
              )}
            </p>
          </div>
        </li>
      </ol>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
        <Link
          href="/account/saved"
          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Saved stays
        </Link>
        <Link
          href="/dashboard/guest-hub"
          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Guest hub
        </Link>
        <Link
          href="/bnhub/stays"
          className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
        >
          Keep exploring
        </Link>
      </div>
    </div>
  );
}
