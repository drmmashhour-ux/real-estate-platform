import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getRecentlyViewedBnhubListings } from "@/lib/bnhub/recently-viewed";
import { getUnifiedRecommendations } from "@/lib/ai/recommendations/getUnifiedRecommendations";

export const metadata: Metadata = {
  title: "Guest hub",
  description: "Saved stays, trips, and homes you follow.",
};

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

function coverStay(listing: {
  listingPhotos?: { url: string }[];
  photos: unknown;
}): string | null {
  const p = listing.listingPhotos?.[0]?.url;
  if (p) return p;
  const raw = listing.photos;
  return Array.isArray(raw) && typeof raw[0] === "string" ? raw[0] : null;
}

export default async function GuestHubDashboardPage() {
  const { userId } = await requireAuthenticatedUser();

  const [favs, bookings, buyerSaved, recentViews, forYou] = await Promise.all([
    prisma.bnhubGuestFavorite.findMany({
      where: { guestUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            nightPriceCents: true,
            listingStatus: true,
            listingCode: true,
            listingPhotos: { take: 1, select: { url: true } },
            photos: true,
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: { guestId: userId },
      orderBy: { checkIn: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        checkIn: true,
        checkOut: true,
        nights: true,
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            listingPhotos: { take: 1, select: { url: true } },
            photos: true,
          },
        },
      },
    }),
    prisma.buyerSavedListing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        fsboListing: {
          select: {
            id: true,
            title: true,
            city: true,
            priceCents: true,
            listingCode: true,
            coverImage: true,
          },
        },
      },
    }),
    getRecentlyViewedBnhubListings(userId, 8),
    getUnifiedRecommendations(userId, 4),
  ]);

  const now = new Date();
  const upcoming = bookings.filter((b) => b.checkOut >= now);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-slate-100">
      <h1 className="text-2xl font-semibold text-white">Guest hub</h1>
      <p className="mt-1 text-sm text-slate-400">
        Shortcuts for stays and resale browsing. Full lists:{" "}
        <Link href="/account/saved" className="font-medium text-emerald-400 hover:text-emerald-300">
          saved stays
        </Link>
        ,{" "}
        <Link href="/account/bookings" className="font-medium text-emerald-400 hover:text-emerald-300">
          bookings
        </Link>
        ,{" "}
        <Link href="/bnhub/trips" className="font-medium text-emerald-400 hover:text-emerald-300">
          trips
        </Link>
        . Recommendations use cities and price signals from your BNHUB activity.
      </p>

      {forYou.length > 0 ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-medium text-white">Recommended for you</h2>
            <Link href="/bnhub/stays" className="text-sm font-medium hover:underline" style={{ color: GOLD }}>
              Search stays →
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {forYou.map((listing) => {
              const img = coverStay(listing);
              const price = (listing.nightPriceCents / 100).toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
              });
              return (
                <li key={listing.id}>
                  <Link
                    href={`/bnhub/listings/${listing.id}`}
                    className="block overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 transition hover:border-white/20"
                  >
                    <div className="aspect-[4/3] bg-slate-800">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-white">{listing.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{listing.city}</p>
                      <p className="mt-1 text-xs font-medium text-emerald-400/90">{price} / night</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-medium text-white">Saved stays (BNHUB)</h2>
          <Link href="/bnhub/stays" className="text-sm font-medium hover:underline" style={{ color: GOLD }}>
            Browse stays →
          </Link>
        </div>
        {favs.length === 0 ? (
          <p className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            No saved stays yet. Open a listing on BNHUB and tap the heart.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {favs.map((f) => {
              const img = coverStay(f.listing);
              return (
                <li key={f.id}>
                  <Link
                    href={`/bnhub/listings/${f.listing.id}`}
                    className="block overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 transition hover:border-white/20"
                  >
                    <div className="aspect-[4/3] bg-slate-800">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-white">{f.listing.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{f.listing.city}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-medium text-white">Recently viewed</h2>
          <Link href="/bnhub/stays" className="text-sm font-medium hover:underline" style={{ color: GOLD }}>
            Browse more →
          </Link>
        </div>
        {recentViews.length === 0 ? (
          <p className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            Listings you open on BNHUB appear here so you can pick up where you left off.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentViews.map((l) => {
              const img = l.coverUrl;
              const price = (l.nightPriceCents / 100).toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
              });
              return (
                <li key={l.id}>
                  <Link
                    href={`/bnhub/listings/${l.id}`}
                    className="block overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 transition hover:border-white/20"
                  >
                    <div className="aspect-[4/3] bg-slate-800">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-white">{l.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{l.city}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{price} / night</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-medium text-white">Booking status</h2>
          <Link href="/bnhub/trips" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            All trips →
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            No bookings yet. When you book a stay, status appears here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((b) => {
              const img = coverStay(b.listing);
              const isUpcoming = b.checkOut >= now;
              return (
                <li key={b.id}>
                  <Link
                    href={`/bnhub/booking/${b.id}`}
                    className="flex gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-3 transition hover:border-white/20"
                  >
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{b.listing.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} ·{" "}
                        {b.nights} nights
                      </p>
                      <p className="mt-1 text-xs">
                        <span
                          className={
                            isUpcoming ? "rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300" : "text-slate-400"
                          }
                        >
                          {b.status.replace(/_/g, " ")}
                        </span>
                        {isUpcoming ? <span className="ml-2 text-slate-500">Upcoming</span> : null}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {upcoming.length > 0 ? (
          <p className="mt-3 text-xs text-slate-500">
            {upcoming.length} upcoming {upcoming.length === 1 ? "stay" : "stays"} in this list.
          </p>
        ) : null}
      </section>

      {buyerSaved.length > 0 ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-medium text-white">Saved homes (resale)</h2>
            <Link href="/dashboard/buyer" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Buyer hub →
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {buyerSaved.map((s) => {
              const l = s.fsboListing;
              return (
                <li key={s.id}>
                  <Link
                    href={`/listings/${l.id}`}
                    className="flex gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-3 hover:border-white/20"
                  >
                    {l.coverImage ? (
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.coverImage} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-20 shrink-0 rounded-lg bg-slate-800" />
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-white">{l.title}</p>
                      <p className="text-xs text-slate-500">{l.city}</p>
                      {l.priceCents != null ? (
                        <p className="mt-1 text-xs text-slate-400">
                          ${(l.priceCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
