import Link from "next/link";
import { ListingCodeBadge } from "@/components/bnhub/ListingCodeBadge";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { prisma } from "@/lib/db";
import { ListingStatus, VerificationStatus } from "@prisma/client";
import { VerifiedListingBadge } from "@/components/listings/VerifiedListingBadge";

function photoFirst(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const s = photos.find((p): p is string => typeof p === "string");
  return s ?? null;
}

/** Sponsored placements — labeled transparently for trust. */
export async function SponsoredListings({ variant = "dark" }: { variant?: "dark" | "booking" } = {}) {
  const ids = await getActivePromotedListingIds({ placement: "SPONSORED", limit: 8 });
  if (ids.length === 0) {
    return null;
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { id: { in: ids }, listingStatus: ListingStatus.PUBLISHED },
    take: 8,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      photos: true,
      verificationStatus: true,
    },
  });

  if (listings.length === 0) return null;

  if (variant === "booking") {
    return (
      <div className="col-span-full rounded-lg border border-premium-gold/25 bg-black/40 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-bold text-premium-gold">Sponsored</h3>
          <span className="rounded border border-premium-gold/30 bg-premium-gold/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-premium-gold/90">
            Ad
          </span>
        </div>
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {listings.map((l) => {
            const href = `/bnhub/stays/${l.listingCode || l.id}`;
            const img = photoFirst(l.photos);
            return (
              <li key={l.id} className="w-44 shrink-0">
                <Link
                  href={href}
                  className="block overflow-hidden rounded-lg border border-premium-gold/20 bg-black/50 shadow-sm transition hover:border-premium-gold/50"
                >
                  <div className="relative aspect-[4/3] bg-neutral-900">
                    {l.verificationStatus === VerificationStatus.VERIFIED ? <VerifiedListingBadge variant="light" /> : null}
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="line-clamp-2 text-xs font-semibold text-neutral-100">{l.title}</p>
                      <ListingCodeBadge code={l.listingCode} className="!text-[9px]" />
                    </div>
                    <p className="mt-1 text-xs font-bold text-premium-gold">${(l.nightPriceCents / 100).toFixed(0)} / nt</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold text-white">Sponsored</h2>
        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
          Ad
        </span>
      </div>
      <ul className="flex gap-4 overflow-x-auto pb-1">
        {listings.map((l) => {
          const href = `/bnhub/stays/${l.listingCode || l.id}`;
          const img = photoFirst(l.photos);
          return (
            <li key={l.id} className="w-44 shrink-0">
              <Link href={href} className="block rounded-lg border border-slate-800 bg-slate-950/60">
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-800">
                  {l.verificationStatus === VerificationStatus.VERIFIED ? <VerifiedListingBadge variant="dark" /> : null}
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="line-clamp-2 text-xs font-medium text-slate-200">{l.title}</p>
                    <ListingCodeBadge code={l.listingCode} className="!text-[9px]" />
                  </div>
                  <p className="mt-1 text-xs text-emerald-400">${(l.nightPriceCents / 100).toFixed(0)} / nt</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
