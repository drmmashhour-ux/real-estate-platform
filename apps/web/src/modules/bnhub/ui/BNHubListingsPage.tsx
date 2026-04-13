import Link from "next/link";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { prisma } from "@/lib/db";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";

export async function BNHubListingsPage() {
  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: "PUBLISHED", verificationStatus: "VERIFIED" },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { id: true, title: true, city: true, nightPriceCents: true },
  });
  const listingsWithTrust = await Promise.all(
    listings.map(async (l) => ({ ...l, trust: await generateListingTrustScore(l.id) }))
  );

  return (
    <div className="space-y-4">
      <h1 className="flex flex-col gap-3 text-2xl font-semibold text-white sm:flex-row sm:items-center">
        <BnHubLogoMark size="sm" className="max-w-[200px]" />
        <span className="sr-only">BNHUB </span>
        <span>listings</span>
      </h1>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {listingsWithTrust.map((l) => (
          <article key={l.id} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
            <h2 className="font-semibold text-white">{l.title}</h2>
            <p className="text-slate-400">{l.city}</p>
            <p className="mt-1 text-slate-200">${(l.nightPriceCents / 100).toFixed(0)} / night</p>
            <p className="mt-1 text-xs text-emerald-400">Trust score: {l.trust.score}</p>
            <Link href={`/bnhub/listings/${l.id}`} className="mt-2 inline-block text-xs text-premium-gold hover:underline">
              View property
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

