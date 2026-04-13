import Link from "next/link";
import { getUnifiedRecommendations } from "@/lib/ai/recommendations/getUnifiedRecommendations";

function coverFromListing(listing: {
  listingPhotos?: { url: string }[];
  photos?: unknown;
}): string | null {
  const p = listing.listingPhotos?.[0]?.url;
  if (p) return p;
  const raw = listing.photos;
  return Array.isArray(raw) && typeof raw[0] === "string" ? raw[0] : null;
}

/**
 * Signed-in “For you” strip on BNHUB stays — uses unified recommendations + search profile.
 */
export async function BnhubPersonalizedForYou({ userId }: { userId: string }) {
  const rows = await getUnifiedRecommendations(userId, 6);
  if (rows.length === 0) return null;

  return (
    <section className="border-b border-premium-gold/15 bg-gradient-to-b from-black to-[#0a0c10] py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold/80">For you</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Recommended stays</h2>
            <p className="mt-0.5 text-sm text-premium-gold/55">
              Based on cities and price range we learn from your browsing.
            </p>
          </div>
          <Link
            href="/dashboard/guest-hub"
            className="text-sm font-medium text-premium-gold hover:text-premium-gold/90"
          >
            Guest hub →
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((listing) => {
            const img = coverFromListing(listing);
            const price = (listing.nightPriceCents / 100).toLocaleString("en-CA", {
              style: "currency",
              currency: "CAD",
            });
            return (
              <li key={listing.id}>
                <Link
                  href={`/bnhub/listings/${listing.id}`}
                  className="group flex overflow-hidden rounded-2xl border border-white/10 bg-[#11151b] transition hover:border-premium-gold/35"
                >
                  <div className="relative h-28 w-36 shrink-0 bg-slate-800">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover transition group-hover:opacity-95" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">No photo</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-white">{listing.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{listing.city}</p>
                    <p className="mt-2 text-sm font-medium text-premium-gold">{price} / night</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
