import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { StarRatingBadge, LuxuryTierBadge } from "@/components/bnhub/quality/BnhubQualityKit";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true, city: true },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  const ids = listings.map((l) => l.id);
  const [clsRows, tierRows] = await Promise.all([
    prisma.bnhubPropertyClassification.findMany({ where: { listingId: { in: ids } } }),
    prisma.bnhubLuxuryTier.findMany({ where: { listingId: { in: ids } } }),
  ]);
  const clsMap = new Map(clsRows.map((r) => [r.listingId, r]));
  const tierMap = new Map(tierRows.map((r) => [r.listingId, r]));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/bnhub/host/dashboard" className="text-sm text-emerald-400">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Listing quality</h1>
        <p className="text-sm text-slate-500">
          BNHUB internal estimates — not official hotel stars. Improve your listing to raise scores and tier eligibility.
        </p>
        <ul className="space-y-3">
          {listings.map((l) => {
            const c = clsMap.get(l.id);
            const t = tierMap.get(l.id);
            return (
              <li key={l.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/bnhub/host/quality/listings/${l.id}`} className="font-medium text-white hover:text-amber-200">
                    {l.title}
                  </Link>
                  <span className="text-xs text-slate-500">{l.city}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c ? <StarRatingBadge stars={c.starRating} /> : null}
                  {t ? <LuxuryTierBadge code={t.tierCode} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
