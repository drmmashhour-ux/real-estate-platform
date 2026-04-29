import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingStatus } from "@/types/listing-status-client";

const fmt = (cents: number, currency: string) => {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

/**
 * Real published stays for guest acquisition (no placeholder listings).
 */
export async function ManagerFeaturedStays() {
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    select: {
      id: true,
      title: true,
      city: true,
      nightPriceCents: true,
      currency: true,
      listingCode: true,
      photos: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        Featured stays go live as hosts publish — browse{" "}
        <Link href="/bnhub/stays" className="font-semibold text-amber-700 underline-offset-2 hover:underline">
          all stays
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((l) => {
        const cover = Array.isArray(l.photos) && typeof l.photos[0] === "string" ? l.photos[0] : null;
        return (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-400/60 hover:shadow-md"
          >
            <div className="aspect-[16/10] bg-slate-200">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">Photo soon</div>
              )}
            </div>
            <div className="p-4">
              <p className="line-clamp-2 font-semibold text-slate-900">{l.title}</p>
              <p className="mt-1 text-sm text-slate-600">{l.city}</p>
              <p className="mt-2 text-sm font-bold text-amber-800">
                {fmt(l.nightPriceCents, l.currency)} <span className="font-normal text-slate-500">/ night</span>
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-400">{l.listingCode}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
