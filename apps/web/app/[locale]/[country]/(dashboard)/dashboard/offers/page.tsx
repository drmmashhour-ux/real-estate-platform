import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { resolveListingTitle } from "@/modules/offers/services/resolve-listing-title";
import { MyOffersActions } from "@/components/offers/MyOffersActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  COUNTERED: "Countered",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

export default async function MyOffersPage() {
  const { userId } = await requireAuthenticatedUser();

  const offers = await prisma.offer.findMany({
    where: { buyerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const titleCache = new Map<string, Promise<string | null>>();
  const listingTitleOf = (listingId: string) => {
    if (!titleCache.has(listingId)) titleCache.set(listingId, resolveListingTitle(listingId));
    return titleCache.get(listingId)!;
  };

  const enriched = await Promise.all(
    offers.map(async (o) => ({
      ...o,
      listingTitle: (await listingTitleOf(o.listingId)) ?? o.listingId,
    }))
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50" data-tour="offers-list">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-white">My offers</h1>
        <p className="mt-1 text-sm text-slate-400">Track listing offers you&apos;ve started or submitted.</p>

        {enriched.length === 0 ? (
          <p className="mt-8 text-slate-500">No offers yet.</p>
        ) : (
          <ul className="mt-8 divide-y divide-white/10 rounded-xl border border-white/10">
            {enriched.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{o.listingTitle}</p>
                  <p className="font-mono text-[10px] text-slate-600">{o.listingId}</p>
                  <p className="text-lg font-semibold text-[#C9A96E]">${o.offeredPrice.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{STATUS_LABEL[o.status] ?? o.status}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</span>
                  <MyOffersActions offerId={o.id} status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
