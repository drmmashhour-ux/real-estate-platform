import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function AccountSavedStaysPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/account/saved");
  }

  const favs = await prisma.bnhubGuestFavorite.findMany({
    where: { guestUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          nightPriceCents: true,
          listingStatus: true,
          listingPhotos: { take: 1, select: { url: true } },
          photos: true,
          listingCode: true,
        },
      },
    },
  });

  function cover(listing: (typeof favs)[0]["listing"]): string | null {
    const p = listing.listingPhotos[0]?.url;
    if (p) return p;
    const raw = listing.photos;
    return Array.isArray(raw) && typeof raw[0] === "string" ? raw[0] : null;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">Saved stays</h1>
        <p className="mt-1 text-sm text-zinc-500">Listings you saved for BNHub trips.</p>
        <p className="mt-4 text-sm">
          <Link href="/account/bookings" className="text-zinc-400 underline hover:text-white">
            My bookings
          </Link>
          <span className="mx-2 text-zinc-600">·</span>
          <Link href="/bnhub/stays" className="font-medium hover:underline" style={{ color: GOLD }}>
            Browse stays
          </Link>
        </p>

        {favs.length === 0 ? (
          <div
            className="mt-10 rounded-2xl border border-zinc-800 p-10 text-center text-sm text-zinc-500"
            style={{ background: "#111" }}
          >
            No saved stays yet. Tap “Save listing” on a property to see it here.
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {favs.map((f) => {
              const l = f.listing;
              const img = cover(l);
              const price = (l.nightPriceCents / 100).toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
                maximumFractionDigits: 0,
              });
              const active = l.listingStatus === ListingStatus.PUBLISHED;
              return (
                <li
                  key={f.id}
                  className="flex gap-4 rounded-2xl border border-zinc-800 p-4"
                  style={{ background: "#111" }}
                >
                  <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-600">No photo</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{l.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">{l.city}</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: GOLD }}>
                      {price}
                      <span className="font-normal text-zinc-500"> / night</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {active ? (
                        <Link
                          href={`/bnhub/stays/${encodeURIComponent(l.listingCode ?? l.id)}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: GOLD }}
                        >
                          View listing
                        </Link>
                      ) : (
                        <span className="text-sm text-zinc-600">No longer available</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
