import Link from "next/link";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { getMarketingFeaturedListingIds } from "@/src/modules/bnhub-marketing/services/marketingFeaturedSearchBridge";
import { getGrowthFeaturedListingIds } from "@/src/modules/bnhub-growth-engine/services/growthFeaturedBridge";
import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

function photoFirst(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const s = photos.find((p): p is string => typeof p === "string");
  return s ?? null;
}

/** Demand boost: paid promotions + internal marketing engine homepage slots. */
export async function FeaturedListings() {
  const [promoIds, marketingIds, growthIds] = await Promise.all([
    getActivePromotedListingIds({ placement: "FEATURED", limit: 12 }),
    getMarketingFeaturedListingIds(12),
    getGrowthFeaturedListingIds(12),
  ]);
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const id of [...promoIds, ...marketingIds, ...growthIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
    if (merged.length >= 12) break;
  }
  if (merged.length === 0) return null;
  const campaignFeatured = new Set(
    [...marketingIds, ...growthIds].filter((id) => !promoIds.includes(id))
  );

  const promoSet = new Set(promoIds);
  const classRows = await prisma.bnhubPropertyClassification.findMany({
    where: { listingId: { in: merged } },
    select: { listingId: true, starRating: true },
  });
  const starMap = new Map(classRows.map((r) => [r.listingId, r.starRating]));
  function starTier(listingId: string): number {
    const s = starMap.get(listingId) ?? 0;
    if (s >= 5) return 2;
    if (s >= 4) return 1;
    return 0;
  }
  const paid = merged.filter((id) => promoSet.has(id));
  const unpaid = merged.filter((id) => !promoSet.has(id));
  const unpaidSorted = [...unpaid].sort((a, b) => {
    const d = starTier(b) - starTier(a);
    if (d !== 0) return d;
    return (starMap.get(b) ?? 0) - (starMap.get(a) ?? 0);
  });
  const displayIds = [...paid, ...unpaidSorted].slice(0, 12);

  const listings = await prisma.shortTermListing.findMany({
    where: { id: { in: displayIds }, listingStatus: ListingStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      photos: true,
    },
  });

  if (listings.length === 0) return null;
  const order = new Map(displayIds.map((id, i) => [id, i]));
  listings.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Featured stays</h2>
          <p className="text-sm text-slate-400">Promoted listings — visibility for hosts, discovery for guests.</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-500/40 px-2 py-0.5 text-xs font-medium text-amber-200">
          Featured
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => {
          const href = `/bnhub/${l.listingCode || l.id}`;
          const img = photoFirst(l.photos);
          const stars = starMap.get(l.id) ?? 0;
          const luxury = stars >= 5;
          return (
            <li key={l.id}>
              <Link href={href} className="group block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="aspect-[16/10] bg-slate-800">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                  ) : null}
                </div>
                <div className="p-3">
                  {luxury ? (
                    <span className="mb-1 mr-1 inline-block rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                      Luxury pick
                    </span>
                  ) : null}
                  {campaignFeatured.has(l.id) ? (
                    <span className="mb-1 inline-block rounded bg-[#C9A646]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C9A646]">
                      Promoted by campaign
                    </span>
                  ) : null}
                  <p className="line-clamp-1 font-medium text-white group-hover:text-amber-200">{l.title}</p>
                  <p className="text-xs text-slate-500">{l.city}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    ${(l.nightPriceCents / 100).toFixed(0)} / night
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
