import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { computeBnhubListingRevMetrics } from "@/src/modules/pricing/bnhub-metrics.service";
import { revenueV4Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function BnhubHostRevenueInsightsPage() {
  const userId = await getGuestId();
  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <p className="text-slate-400">Sign in to view BNHub revenue insights.</p>
      </main>
    );
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId, listingStatus: "PUBLISHED" },
    select: { id: true, title: true, city: true, nightPriceCents: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const rows: {
    id: string;
    title: string;
    city: string;
    nightPriceCents: number;
    metrics: Awaited<ReturnType<typeof computeBnhubListingRevMetrics>>;
  }[] = [];

  for (const l of listings) {
    const metrics = revenueV4Flags.bnhubDynamicPricingV1 ? await computeBnhubListingRevMetrics(l.id) : null;
    rows.push({ ...l, metrics });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/bnhub/host/dashboard" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Host dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">BNHub revenue insights</h1>
        <p className="mt-2 text-sm text-slate-400">
          Observable booking metrics and dynamic pricing suggestions. Recommendations do not change your nightly rate until you
          confirm in pricing tools.
        </p>

        {rows.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No published stays yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="font-medium text-slate-100">{r.title}</p>
                <p className="text-xs text-slate-500">
                  {r.city} · current {(r.nightPriceCents / 100).toFixed(0)} / night
                </p>
                {r.metrics && (
                  <p className="mt-2 text-xs text-slate-400">
                    Rev (30d est): {(r.metrics.revenueCents / 100).toFixed(0)} · occupancy≈{(r.metrics.occupancyApprox * 100).toFixed(0)}%
                    · RevPAN≈{(r.metrics.revPanApproxCents / 100).toFixed(0)}/night calendar · {r.metrics.confidenceNote}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Nightly price suggestions: use{" "}
                  <Link className="text-emerald-400 hover:underline" href="/bnhub/host/pricing">
                    BNHub pricing
                  </Link>{" "}
                  (profiles refresh via cron when dynamic pricing is enabled).
                </p>
                {!revenueV4Flags.bnhubDynamicPricingV1 && (
                  <p className="mt-2 text-xs text-slate-500">Enable FEATURE_BNHUB_DYNAMIC_PRICING_V1 for metrics.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
