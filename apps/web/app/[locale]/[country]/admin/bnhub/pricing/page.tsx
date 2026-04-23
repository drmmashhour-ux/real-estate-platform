import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";
import { revenueV4Flags } from "@/config/feature-flags";
import { computeBnhubAdvisoryPricing } from "@/modules/bnhub/pricing/bnhub-dynamic-pricing.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [profiles, conversionRollup] = await Promise.all([
    prisma.bnhubDynamicPricingProfile.findMany({
      orderBy: { computedAt: "desc" },
      take: 40,
      select: {
        listingId: true,
        recommendedPrice: true,
        confidenceScore: true,
        computedAt: true,
        listing: { select: { title: true, city: true } },
      },
    }),
    prisma.aiConversionSignal
      .groupBy({
        by: ["eventType"],
        where: { createdAt: { gte: since30 } },
        _count: { _all: true },
      })
      .catch(() => [] as { eventType: string; _count: { _all: number } }[]),
  ]);

  const rollupSorted = [...conversionRollup].sort((a, b) => b._count._all - a._count._all);

  return (
    <HubLayout title="BNHUB pricing" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
          ← BNHUB
        </Link>
        <h1 className="text-xl font-bold">Dynamic pricing profiles</h1>
        <p className="text-sm text-zinc-500">AI-assisted recommendations — hosts see non-binding guidance unless autopricing is enabled.</p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Host funnel signals (30d)</h2>
            <Link href="/admin/funnel" className="text-xs text-amber-400 hover:text-amber-300">
              Full funnel →
            </Link>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Counts from <code className="text-zinc-400">ai_conversion_signals</code> (client POST{" "}
            <code className="text-zinc-400">/api/bnhub/conversion-signal</code>). Directional — use with search/booking
            analytics.
          </p>
          {rollupSorted.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No signals in the last 30 days.</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rollupSorted.map((r) => (
                <li
                  key={r.eventType}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/80 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-zinc-300">{r.eventType}</span>
                  <span className="tabular-nums text-zinc-100">{r._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <h2 className="pt-2 text-sm font-semibold text-zinc-300">Recent dynamic pricing profiles</h2>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 text-sm">
          {profiles.map((p) => (
            <li key={p.listingId} className="flex flex-wrap justify-between gap-2 p-3">
              <span>
                {p.listing.title} · {p.listing.city}
                <Link className="ml-2 text-amber-400" href={`/admin/bnhub/pricing/listings/${p.listingId}`}>
                  Detail
                </Link>
              </span>
              <span className="text-zinc-400">
                ${Number(p.recommendedPrice).toFixed(0)} · {p.confidenceScore}%
              </span>
            </li>
          ))}
        </ul>
      </div>

        {advisoryRows.length > 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <h2 className="text-sm font-semibold text-white">Advisory pricing snapshot (sample)</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Read-only preview when <code className="text-zinc-400">FEATURE_BNHUB_DYNAMIC_PRICING_V1</code> is on — not
              applied to live prices.
            </p>
            <ul className="mt-3 divide-y divide-zinc-800 text-sm">
              {advisoryRows.map(({ listing, advisory }) =>
                advisory ? (
                  <li key={listing.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span className="text-zinc-300">
                      {listing.title ?? listing.id.slice(0, 8)} · {listing.city}
                    </span>
                    <span className="font-mono text-xs text-zinc-400">
                      {(listing.nightPriceCents / 100).toFixed(0)} → {(advisory.suggestedPriceCents / 100).toFixed(0)}{" "}
                      · {advisory.confidenceLabel} · {advisory.noChangeRecommended ? "hold" : "review"}
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        ) : null}
    </HubLayout>
  );
}
