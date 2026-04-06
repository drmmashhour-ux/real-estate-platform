import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

const fmt = (cents: number, currency: string) => {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "CAD" }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

function bedBathLabel(bedrooms: number | null, beds: number, baths: number) {
  const bd = bedrooms ?? beds;
  const bth = baths % 1 === 0 ? String(baths) : baths.toFixed(1);
  return `${bd} bd · ${bth} ba`;
}

/** Published short-term listings — real DB rows only. */
export async function LandingFeaturedListings() {
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    select: {
      id: true,
      city: true,
      nightPriceCents: true,
      currency: true,
      photos: true,
      bedrooms: true,
      beds: true,
      baths: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 9,
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[#D4AF37]/25 bg-white/[0.03] px-6 py-14 text-center">
        <p className="text-lg font-medium text-white">No published stays yet</p>
        <p className="mt-2 text-sm text-white/60">
          <Link href="/bnhub/stays" className="font-semibold text-[#D4AF37] underline-offset-4 hover:underline">
            Browse BNHub stays
          </Link>{" "}
          or{" "}
          <Link href="/host/listings/new" className="font-semibold text-[#D4AF37] underline-offset-4 hover:underline">
            list a property
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {rows.map((l) => {
        const cover = Array.isArray(l.photos) && typeof l.photos[0] === "string" ? l.photos[0] : null;
        return (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-black text-left shadow-lg transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-[0_20px_48px_rgba(212,175,55,0.1)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-white/10 to-black">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-black">
                  <span className="text-4xl font-semibold text-[#D4AF37]/35" aria-hidden>
                    {(l.city?.trim().charAt(0) || "·").toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col border-t border-[#D4AF37]/15 p-4">
              <p className="text-lg font-bold text-[#D4AF37]">{fmt(l.nightPriceCents, l.currency)}</p>
              <p className="mt-2 line-clamp-1 text-sm font-medium text-white">{l.city}</p>
              <p className="mt-2 text-xs text-white/55">{bedBathLabel(l.bedrooms, l.beds, l.baths)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
